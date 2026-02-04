import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Razorpay from 'razorpay';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || ''; 
const siteUrl = process.env.VITE_SITE_URL || 'http://localhost:3000';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Fix: CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', siteUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment details' });
      }

      // 1. Verify Signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      // 2. Fetch Order Details to know what was bought (Security Best Practice)
      let planType = 'pro_monthly';
      let amount = 0;

      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        if (order.notes && order.notes.planType) {
            planType = order.notes.planType as string;
        }
        amount = typeof order.amount === 'string' ? parseInt(order.amount) : order.amount;
      } catch (err) {
        console.error("Failed to fetch Razorpay order:", err);
        // We continue if signature is valid, assuming default plan if fetch fails (fallback)
      }

      // 3. Update User DB
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: 'User not found' });

      // 4. Log Payment
      await supabase.from('payment_logs').insert({
          user_id: user.id,
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          amount: amount,
          status: 'captured'
      });

      // 5. Apply Business Logic
      let updateData: any = {};
      
      if (planType === 'pro_monthly') {
        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'Pro' })
          .eq('id', user.id);
          
        if (error) throw error;
      } else if (planType === 'topup_5') {
        // Logic: Reduce 'analyses_used' counter by 5 (technically we "remove" 5 from the used count, 
        // effectively giving them 5 more. Or if we track "credits", we add 5. 
        // The original code was: updateData = { analyses_used: Math.max(-100, currentUsed - 5) };
        // So we are SUBTRACTING 5 from the "used" count.
        // We will call our RPC with -5.
        const { error } = await supabase.rpc('decrement_credits', { user_id: user.id, amount: -5 });
        
        if (error) throw error;
      }

      return res.status(200).json({ success: true, planType });
  } catch (err: any) {
      console.error("Verify Endpoint Error:", err);
      return res.status(500).json({ error: "Internal Server Error during verification" });
  }
}