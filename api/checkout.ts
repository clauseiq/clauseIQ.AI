import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const siteUrl = process.env.VITE_SITE_URL || 'http://localhost:3000';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', siteUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return res.status(401).json({ error: 'Invalid session' });

  const { planType, userCurrency } = req.body; // 'pro_monthly' or 'topup_5', currency 'INR' or 'USD'

  try {
    // Determine Currency and Amount
    // Default to USD if not explicitly INR
    const currency = userCurrency === 'INR' ? 'INR' : 'USD';
    
    let amount;
    let description;

    if (currency === 'INR') {
        // INR Pricing
        amount = planType === 'topup_5' ? 79900 : 249900; // ₹799 or ₹2499 (in paise)
    } else {
        // USD Pricing
        amount = planType === 'topup_5' ? 900 : 2900; // $9 or $29 (in cents)
    }

    if (planType === 'topup_5') {
        description = "5 Analysis Credits Top-up";
    } else {
        description = "Pro Plan Subscription";
    }

    // Razorpay receipt ID allows only alphanumeric and underscores.
    const cleanUserId = user.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const receiptId = `rcpt_${cleanUserId}_${Date.now()}`;

    const options = {
      amount: amount, 
      currency: currency,
      receipt: receiptId,
      notes: {
        userId: user.id,
        userEmail: user.email,
        planType: planType || 'pro_monthly'
      }
    };

    const order = await razorpay.orders.create(options);

    // We return the Key ID here so the frontend doesn't need it hardcoded
    return res.status(200).json({ 
      orderId: order.id, 
      keyId: process.env.RAZORPAY_KEY_ID, 
      amount: options.amount,
      currency: options.currency
    });

  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return res.status(500).json({ error: error.message || "Failed to create order" });
  }
}