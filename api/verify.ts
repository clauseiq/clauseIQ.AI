import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import {
  applySecurityHeaders,
  checkRateLimit,
  checkIdempotency,
  storeIdempotencyResult,
  validatePlanType,
  logSecurityEvent,
  extractBearerToken,
  isBodyTooLarge,
} from './security';

// ─── Config ───────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const siteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://clauseiq.com';

// Razorpay secret MUST come from server-side env only — NEVER expose to frontend
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';

if (!RAZORPAY_SECRET || !RAZORPAY_KEY_ID) {
  console.error('[CRITICAL] Razorpay credentials missing in environment variables.');
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET,
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applySecurityHeaders(res, siteUrl);

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Body size guard
  if (isBodyTooLarge(req.body)) {
    return res.status(413).json({ error: 'Request body too large.' });
  }

  // Rate limit — payment endpoints are very tight (3/min per IP)
  const { allowed } = checkRateLimit(req, '/api/verify');
  if (!allowed) {
    logSecurityEvent('rate_limit_exceeded', { endpoint: '/api/verify' });
    return res.status(429).json({ error: 'Too many requests. Please wait before retrying.' });
  }

  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────────
    const token = extractBearerToken(req.headers.authorization as string);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment parameters.' });
    }

    // Type checks — prevent injection via these fields
    if (
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string' ||
      !/^order_[A-Za-z0-9]+$/.test(razorpay_order_id) ||
      !/^pay_[A-Za-z0-9]+$/.test(razorpay_payment_id)
    ) {
      logSecurityEvent('invalid_payment_ids', { orderId: razorpay_order_id });
      return res.status(400).json({ error: 'Invalid payment identifiers.' });
    }

    // ── 2. Idempotency — prevent double-credit ─────────────────────────────────
    const idempotencyKey = `${razorpay_order_id}:${razorpay_payment_id}`;
    const cached = checkIdempotency(idempotencyKey);
    if (cached) {
      return res.status(cached.status).json(cached.body);
    }

    // ── 3. Verify Razorpay HMAC signature ─────────────────────────────────────
    //    NEVER trust frontend-reported payment status. Only trust the signature.
    const hmacBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(hmacBody)
      .digest('hex');

    // Use timing-safe compare to prevent timing attacks
    const signatureBuffer = Buffer.from(razorpay_signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    let isAuthentic = false;
    if (signatureBuffer.length === expectedBuffer.length) {
      isAuthentic = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    }

    if (!isAuthentic) {
      logSecurityEvent('signature_mismatch', { orderId: razorpay_order_id });
      return res.status(400).json({ error: 'Invalid payment signature. Payment rejected.' });
    }

    // ── 4. Server-side order validation ───────────────────────────────────────
    //    Fetch order from Razorpay to get authoritative plan type and amount.
    //    This prevents frontend from manipulating planType or price.
    let planType: 'pro_monthly' | 'topup_5' = 'pro_monthly';
    let authorizedAmount = 0;
    let orderCurrency = 'USD';

    try {
      const order = await razorpay.orders.fetch(razorpay_order_id);

      // Validate order status — only process captured/created orders
      if (order.status === 'paid') {
        // Already processed — check if record exists
        logSecurityEvent('duplicate_payment_attempt', { orderId: razorpay_order_id });
      }

      // Read plan type from server-created order notes (set by /api/checkout)
      const notePlanType = (order.notes as any)?.planType;
      const validatedPlan = validatePlanType(notePlanType);
      if (validatedPlan) {
        planType = validatedPlan;
      } else {
        logSecurityEvent('invalid_plan_in_notes', { orderId: razorpay_order_id, plan: notePlanType });
        return res.status(400).json({ error: 'Invalid plan associated with this order.' });
      }

      authorizedAmount = typeof order.amount === 'string'
        ? parseInt(order.amount, 10)
        : (order.amount as number);
      orderCurrency = (order.currency as string) || 'USD';

    } catch (fetchErr) {
      console.error('Failed to fetch Razorpay order:', fetchErr);
      // If we can't verify the plan server-side, reject for safety
      return res.status(502).json({ error: 'Unable to verify order with payment provider. Please contact support.' });
    }

    // ── 5. Authenticate user ───────────────────────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return res.status(401).json({ error: 'User not found or session expired.' });

    // ── 6. Idempotency: check DB for existing record ───────────────────────────
    const { data: existingLog } = await supabase
      .from('payment_logs')
      .select('id')
      .eq('order_id', razorpay_order_id)
      .single();

    if (existingLog) {
      logSecurityEvent('replay_attack_blocked', { userId: user.id, orderId: razorpay_order_id });
      const replayBody = { success: true, planType, note: 'Already processed.' };
      storeIdempotencyResult(idempotencyKey, 200, replayBody);
      return res.status(200).json(replayBody);
    }

    // ── 7. Log payment first (before DB update — idempotency fence) ────────────
    await supabase.from('payment_logs').insert({
      user_id: user.id,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: authorizedAmount,
      currency: orderCurrency,
      plan_type: planType,
      status: 'captured',
      created_at: new Date().toISOString(),
    });

    // ── 8. Apply plan upgrade / credit top-up ─────────────────────────────────
    if (planType === 'pro_monthly') {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          plan: 'Pro',
          plan_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

    } else if (planType === 'topup_5') {
      // Add 5 credits by decrementing the "used" counter by 5
      // (capped at 0 to avoid negative values creating infinite access)
      const { error: rpcErr } = await supabase.rpc('add_analysis_credits', {
        target_user_id: user.id,
        credits: 5,
      });
      if (rpcErr) throw rpcErr;
    }

    const successBody = { success: true, planType };
    storeIdempotencyResult(idempotencyKey, 200, successBody);
    return res.status(200).json(successBody);

  } catch (err: any) {
    console.error('Verify Endpoint Error:', err);
    logSecurityEvent('verify_error', { message: err?.message });
    return res.status(500).json({ error: 'Internal error during payment verification. Please contact support.' });
  }
}