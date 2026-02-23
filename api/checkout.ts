import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import {
  applySecurityHeaders,
  checkRateLimit,
  validatePlanType,
  validateCurrency,
  logSecurityEvent,
  extractBearerToken,
  isBodyTooLarge,
} from './security';

// ─── Config ───────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const siteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://clauseiq.com';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// ─── Authoritative Server-Side Pricing ────────────────────────────────────────
// NEVER trust price from frontend — always derive from this map.
const PRICING: Record<string, Record<string, number>> = {
  INR: {
    pro_monthly: 249900, // ₹2,499 in paise
    topup_5: 79900,      // ₹799 in paise
  },
  USD: {
    pro_monthly: 2900,   // $29 in cents
    topup_5: 900,        // $9 in cents
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applySecurityHeaders(res, siteUrl);

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Body size guard
  if (isBodyTooLarge(req.body)) {
    return res.status(413).json({ error: 'Request body too large.' });
  }

  // Rate limit — checkout is very sensitive
  const { allowed } = checkRateLimit(req, '/api/checkout');
  if (!allowed) {
    logSecurityEvent('rate_limit_exceeded', { endpoint: '/api/checkout' });
    return res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
  }

  // Auth
  const token = extractBearerToken(req.headers.authorization as string);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user || !user.email) return res.status(401).json({ error: 'Invalid session.' });

  // ── Server-side input validation ──────────────────────────────────────────────
  const planType = validatePlanType(req.body?.planType);
  if (!planType) {
    logSecurityEvent('invalid_plan_requested', { userId: user.id, plan: req.body?.planType });
    return res.status(400).json({ error: 'Invalid plan type.' });
  }

  const currency = validateCurrency(req.body?.userCurrency);
  const amount = PRICING[currency]?.[planType];

  if (!amount) {
    return res.status(400).json({ error: 'Unable to determine pricing. Contact support.' });
  }

  try {
    // Clean receipt ID
    const cleanUserId = user.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const receiptId = `rcpt_${cleanUserId}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receiptId,
      notes: {
        userId: user.id,       // For server-side lookup in /api/verify
        userEmail: user.email,
        planType,              // Authoritative source — read back in /api/verify
      },
    });

    // Return ONLY orderId, keyId, amount, currency — NEVER the secret
    return res.status(200).json({
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID, // Public key ID is safe to expose
      amount,
      currency,
    });

  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    logSecurityEvent('checkout_error', { userId: user.id, message: error?.message });
    return res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
  }
}