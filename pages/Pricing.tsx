import React, { useState, useEffect } from 'react';
import { Check, X, Zap, Crown, Building2, HelpCircle, ShieldCheck, Globe, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UpgradeModal } from '../components/UpgradeModal';

export const Pricing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  useEffect(() => {
    // Detect timezone to set currency
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
      setCurrency('INR');
    }
  }, []);

  const handlePlanClick = (plan: 'Free' | 'Pro' | 'Business') => {
    if (plan === 'Free') {
      if (isAuthenticated) navigate('/dashboard');
      else navigate('/?signup=true');
    } else if (plan === 'Pro') {
      if (isAuthenticated) {
        setShowUpgradeModal(true);
      } else {
        navigate('/?login=true');
      }
    } else if (plan === 'Business') {
      window.location.href = 'mailto:sales@clauseiq.com?subject=Business%20Plan%20Inquiry';
    }
  };

  const prices = {
      pro: {
          USD: isAnnual ? '19' : '29',
          INR: isAnnual ? '1,999' : '2,499'
      },
      business: {
          USD: '99',
          INR: '8,999'
      },
      annualBilled: {
          USD: '228',
          INR: '23,988'
      }
  };

  return (
    <div className="bg-white dark:bg-[#020617] min-h-screen transition-colors duration-300">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} currency={currency} />}
      
      {/* Header */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full z-0 pointer-events-none">
             <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
             <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-medium">
            Choose the plan that fits your deal flow. No hidden fees. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center mb-16">
             <span className={`text-sm font-bold mr-4 ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Monthly</span>
             <button 
               onClick={() => setIsAnnual(!isAnnual)}
               className="relative w-16 h-8 bg-slate-200 dark:bg-slate-800 rounded-full p-1 transition-colors focus:outline-none"
             >
               <div className={`w-6 h-6 bg-white dark:bg-blue-500 rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-8' : 'translate-x-0'}`}></div>
             </button>
             <span className={`text-sm font-bold ml-4 ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                Yearly <span className="text-emerald-500 text-xs ml-1 font-extrabold uppercase tracking-wide">Save 20%</span>
             </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             
             {/* FREE PLAN */}
             <div className="bg-slate-50 dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 flex flex-col hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                <div className="mb-6">
                   <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-600 dark:text-slate-400">
                      <Zap className="h-6 w-6" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Starter</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-sm">Perfect for freelancers checking occasional contracts.</p>
                </div>
                <div className="mb-8">
                   <span className="text-4xl font-bold text-slate-900 dark:text-white">{currency === 'INR' ? '₹0' : '$0'}</span>
                   <span className="text-slate-400 font-medium"> / forever</span>
                </div>
                <button 
                  onClick={() => handlePlanClick('Free')}
                  className="w-full py-4 rounded-xl font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all mb-8"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
                </button>
                <div className="space-y-4 flex-grow">
                   <Feature text="3 Contract Analyses / mo" />
                   <Feature text="Basic Risk Detection" />
                   <Feature text="Standard Processing Speed" />
                   <Feature text="1 User Seat" />
                   <Feature text="Email Support" />
                </div>
             </div>

             {/* PRO PLAN */}
             <div className="relative bg-white dark:bg-slate-900 rounded-[32px] p-8 border-2 border-blue-500 dark:border-blue-500 shadow-2xl shadow-blue-500/10 flex flex-col transform md:-translate-y-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">Most Popular</div>
                <div className="mb-6">
                   <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                      <Crown className="h-6 w-6" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pro</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-sm">For founders and consultants who sign deals weekly.</p>
                </div>
                <div className="mb-8">
                   <span className="text-5xl font-bold text-slate-900 dark:text-white">{currency === 'INR' ? '₹' : '$'}{prices.pro[currency]}</span>
                   <span className="text-slate-400 font-medium"> / mo</span>
                   {isAnnual && <p className="text-xs text-emerald-500 font-bold mt-2">Billed {currency === 'INR' ? '₹' : '$'}{prices.annualBilled[currency]} yearly</p>}
                </div>
                <button 
                  onClick={() => handlePlanClick('Pro')}
                  className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1 transition-all mb-4"
                >
                  Upgrade Now
                </button>
                <p className="text-center text-xs text-slate-400 mb-6">7-day money-back guarantee.</p>
                <div className="space-y-4 flex-grow">
                   <Feature text="Unlimited Contract Analyses" active />
                   <Feature text="Chat with Contracts (AI)" active />
                   <Feature text="Priority Processing Speed" active />
                   <Feature text="Export PDF Reports" active />
                   <Feature text="Negotiation Playbooks" active />
                   <Feature text="Clause Comparison Engine" active />
                </div>
             </div>

             {/* BUSINESS PLAN */}
             <div className="bg-slate-50 dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 flex flex-col hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                <div className="mb-6">
                   <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                      <Building2 className="h-6 w-6" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Business</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-sm">Custom solutions for legal teams and agencies.</p>
                </div>
                <div className="mb-8">
                   <span className="text-4xl font-bold text-slate-900 dark:text-white">{currency === 'INR' ? '₹' : '$'}{prices.business[currency]}</span>
                   <span className="text-slate-400 font-medium"> / mo</span>
                </div>
                <button 
                  onClick={() => handlePlanClick('Business')}
                  className="w-full py-4 rounded-xl font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:border-purple-300 dark:hover:border-purple-600 transition-all mb-8"
                >
                  Contact Sales
                </button>
                <div className="space-y-4 flex-grow">
                   <Feature text="Everything in Pro" active />
                   <Feature text="5 Team Seats" active />
                   <Feature text="API Access" active />
                   <Feature text="Custom Jurisdictions" active />
                   <Feature text="Dedicated Account Manager" active />
                   <Feature text="SSO Enforcement" active />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison / Trust */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="flex flex-col items-center">
                 <div className="p-4 bg-white dark:bg-slate-900 rounded-full mb-6 shadow-sm">
                    <ShieldCheck className="h-8 w-8 text-emerald-500" />
                 </div>
                 <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Enterprise Security</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Bank-grade encryption in transit and at rest. We never train on your data.</p>
              </div>
              <div className="flex flex-col items-center">
                 <div className="p-4 bg-white dark:bg-slate-900 rounded-full mb-6 shadow-sm">
                    <Globe className="h-8 w-8 text-blue-500" />
                 </div>
                 <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Global Jurisdictions</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Trained on US, UK, EU, Australian, and Indian commercial law standards.</p>
              </div>
              <div className="flex flex-col items-center">
                 <div className="p-4 bg-white dark:bg-slate-900 rounded-full mb-6 shadow-sm">
                    <Clock className="h-8 w-8 text-purple-500" />
                 </div>
                 <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">24/7 Availability</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">No waiting for business hours. Get instant feedback whenever deals happen.</p>
              </div>
           </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24 bg-white dark:bg-[#020617]">
         <div className="max-w-3xl mx-auto px-6 sm:px-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-8">
               <FaqItem q="Can I cancel my subscription anytime?" a="Yes. You can cancel directly from your dashboard. You'll retain access until the end of your billing cycle." />
               <FaqItem q="What happens if I hit the limit on the Free plan?" a="You won't be able to analyze new contracts until the next month, or you can upgrade to Pro for instant unlimited access." />
               <FaqItem q="Do you offer refunds?" a="We offer a 7-day money-back guarantee if you're not satisfied with the Pro plan." />
               <FaqItem q="Is this a replacement for a lawyer?" a="No. Clause IQ is a decision support tool. It helps you identify risks but does not provide legal advice or representation." />
            </div>
         </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white dark:bg-[#020617]">
         <div className="max-w-5xl mx-auto px-6 sm:px-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-[32px] p-12 md:p-20 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
               <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to sign safer deals?</h2>
                  <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Join 1,000+ founders and freelancers who trust Clause IQ to protect their business.</p>
                  <button onClick={() => navigate('/?signup=true')} className="bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl">
                     Start Free Trial
                  </button>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

const Feature: React.FC<{ text: string; active?: boolean }> = ({ text, active = true }) => (
  <div className={`flex items-start ${active ? 'opacity-100' : 'opacity-50'}`}>
     <div className={`mt-0.5 mr-3 rounded-full p-0.5 ${active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
        {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
     </div>
     <span className={`text-sm font-medium ${active ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 line-through'}`}>{text}</span>
  </div>
);

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => (
   <div>
      <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 flex items-center">
         <HelpCircle className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
         {q}
      </h4>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-8">{a}</p>
   </div>
);