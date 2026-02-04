import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Crown, Ticket } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  onClose: () => void;
  currency?: 'USD' | 'INR';
}

type PlanType = 'pro_monthly' | 'topup_5';

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, currency: propCurrency }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro_monthly');
  const [activeCurrency, setActiveCurrency] = useState<'USD' | 'INR'>(propCurrency || 'USD');
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // If prop is not provided, try to detect based on timezone
  useEffect(() => {
    if (!propCurrency) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
        setActiveCurrency('INR');
      } else {
        setActiveCurrency('USD');
      }
    } else {
        setActiveCurrency(propCurrency);
    }
  }, [propCurrency]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if script is already loaded
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      
      // Check if script tag exists but hasn't loaded yet
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first.');
        setLoading(false);
        return;
      }

      // 1. Create Order on Server
      const orderRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            planType: selectedPlan,
            userCurrency: activeCurrency
        })
      });
      
      if (!orderRes.ok) {
        throw new Error(`Order creation failed: ${orderRes.statusText}`);
      }

      const orderData = await orderRes.json();
      if (orderData.error) throw new Error(orderData.error);

      // 2. Open Razorpay Modal
      const options = {
        key: orderData.keyId, // Key ID returned from backend
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Clause IQ",
        description: selectedPlan === 'pro_monthly' ? "Pro Subscription" : "5 Analysis Credits",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify Payment on Server
          toast.info("Verifying payment...");
          try {
            const verifyRes = await fetch('/api/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            if (!verifyRes.ok) {
                 // Try to read error text
                 const text = await verifyRes.text();
                 try {
                     const json = JSON.parse(text);
                     throw new Error(json.error || "Verification failed");
                 } catch (e) {
                     // If 404 html or other non-json error
                     console.error("Verification endpoint error:", text);
                     throw new Error(`Payment verified but server update failed (${verifyRes.status}). Please contact support.`);
                 }
            }

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
               toast.success(selectedPlan === 'pro_monthly' ? "Welcome to Pro!" : "Credits Added Successfully!");
               await refreshProfile(); // Refresh context without page reload
               onClose();
               navigate('/dashboard?payment=success'); // Soft navigation
            } else {
               toast.error("Payment verification failed. Please contact support.");
            }
          } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Error verifying payment.");
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
            ondismiss: function() {
                setLoading(false);
            }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to initiate payment.");
      setLoading(false);
    }
  };

  const getPrice = (plan: PlanType) => {
    if (activeCurrency === 'INR') {
        return plan === 'pro_monthly' ? '₹2,499' : '₹799';
    }
    return plan === 'pro_monthly' ? '$29' : '$9';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg overflow-hidden animate-reveal shadow-2xl border border-slate-200 dark:border-slate-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"><X className="h-6 w-6" /></button>

        <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Choose your upgrade</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Select the plan that fits your workflow.</p>
        </div>

        <div className="p-8 space-y-4">
            
            {/* Option 1: Subscription */}
            <div 
                onClick={() => setSelectedPlan('pro_monthly')}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'pro_monthly' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-blue-200'}`}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${selectedPlan === 'pro_monthly' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                            <Crown className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-900 dark:text-white">Pro Monthly</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Unlimited scans & Priority speed</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-xl font-bold text-slate-900 dark:text-white">{getPrice('pro_monthly')}</span>
                        <span className="text-xs text-slate-500">per month</span>
                    </div>
                </div>
                {selectedPlan === 'pro_monthly' && (
                    <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-1 rounded-full"><Check className="h-4 w-4" /></div>
                )}
            </div>

            {/* Option 2: Top Up */}
            <div 
                onClick={() => setSelectedPlan('topup_5')}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'topup_5' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-purple-200'}`}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${selectedPlan === 'topup_5' ? 'bg-purple-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                            <Ticket className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-900 dark:text-white">5-Scan Pass</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">One-time payment. Never expires.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-xl font-bold text-slate-900 dark:text-white">{getPrice('topup_5')}</span>
                        <span className="text-xs text-slate-500">one-time</span>
                    </div>
                </div>
                {selectedPlan === 'topup_5' && (
                    <div className="absolute -top-3 -right-3 bg-purple-500 text-white p-1 rounded-full"><Check className="h-4 w-4" /></div>
                )}
            </div>

            <button 
                onClick={handlePayment}
                disabled={loading}
                className={`w-full py-4 mt-4 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-70 text-white ${
                    selectedPlan === 'pro_monthly' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500' 
                    : 'bg-gradient-to-r from-purple-600 to-purple-500'
                }`}
            >
                {loading ? <Zap className="h-5 w-5 animate-pulse" /> : `Pay ${getPrice(selectedPlan)}`}
            </button>
            <div className="flex justify-center items-center space-x-2 mt-4 opacity-60">
                {activeCurrency === 'INR' && <img src="https://cdn.razorpay.com/static/assets/methods/upi.png" alt="UPI" className="h-4" />}
                <img src="https://cdn.razorpay.com/static/assets/methods/visa.png" alt="Visa" className="h-3" />
                <img src="https://cdn.razorpay.com/static/assets/methods/mastercard.png" alt="Mastercard" className="h-3" />
                <span className="text-[10px] text-slate-400">Secured by Razorpay</span>
            </div>
        </div>
      </div>
    </div>
  );
};