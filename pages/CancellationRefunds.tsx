import React from 'react';
import { CreditCard, ArrowLeft, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CancellationRefunds: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-reveal font-sans">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 md:p-12 shadow-sm">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <CreditCard className="h-6 w-6 text-slate-900 dark:text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Cancellation & Refunds</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Last Updated: October 26, 2024</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-slate-600 dark:text-slate-300">
          
          {/* Cancellation Section */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <XCircle className="h-6 w-6 text-slate-400 mr-3" />
              Cancellation Policy
            </h2>
            <p>
              We believe in freedom, not lock-ins. You can cancel your subscription at any time, for any reason, with just a few clicks.
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 mt-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">How to Cancel</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm font-medium">
                <li>Log in to your Clause IQ account.</li>
                <li>Navigate to the <strong>Dashboard</strong> and click your profile icon.</li>
                <li>Select <strong>Billing Settings</strong> (or "Manage Subscription").</li>
                <li>Click <strong>Cancel Subscription</strong>.</li>
              </ol>
              <p className="text-sm mt-4">
                Alternatively, you can email <a href="mailto:support@clauseiq.com" className="text-blue-600 hover:underline">support@clauseiq.com</a> with the subject line "Cancel Subscription," and we will handle it for you.
              </p>
            </div>

            <p className="mt-6">
              <strong>After Cancellation:</strong> Your account will remain active until the end of your current billing cycle. You will not be charged again. After the billing cycle ends, your account will revert to the "Free" plan.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Refund Section */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <RefreshCw className="h-6 w-6 text-slate-400 mr-3" />
              Refund Policy
            </h2>

            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 mb-6">
              <div className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">7-Day Money-Back Guarantee</h3>
                  <p className="text-sm text-emerald-800/80 dark:text-emerald-100/80 leading-relaxed">
                    If you are not satisfied with Clause IQ Pro for any reason, let us know within <strong>7 days</strong> of your initial purchase, and we will issue a full refund. No questions asked.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Monthly Plans</h3>
            <p className="mb-4">
              Beyond the 7-day guarantee window, we generally do not offer refunds for partial months of service. If you cancel, you will retain access until the end of your billing period.
            </p>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Annual Plans</h3>
            <p className="mb-4">
              If you cancel an annual plan within the first 30 days, we will provide a prorated refund for the remaining months. After 30 days, annual subscriptions are non-refundable, but access continues until the end of the year term.
            </p>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">One-Time Credits (Top-ups)</h3>
            <p>
              Credit packs (e.g., "5-Scan Pass") are non-refundable once any of the credits have been used. Unused credit packs may be refunded within 14 days of purchase upon request.
            </p>
          </section>

          <section className="border-t border-slate-100 dark:border-slate-800 pt-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Contact for Billing Issues</h2>
            <p>
              If you believe you have been charged in error or have a specific billing issue, please contact us immediately:
            </p>
            <a href="mailto:support@clauseiq.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline block mt-2">support@clauseiq.com</a>
          </section>

        </div>
      </div>
    </div>
  );
};