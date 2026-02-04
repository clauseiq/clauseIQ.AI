import React from 'react';
import { Mail, MapPin, Clock, ArrowLeft, MessageSquare, Building2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ContactUs: React.FC = () => {
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
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-8 mb-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Contact Us</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            We're here to help. Reach out to us for support, sales, or feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Contact Methods */}
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mr-4">
                <MessageSquare className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Customer Support</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">For issues with your account, billing, or analysis.</p>
                <a href="mailto:support@clauseiq.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">support@clauseiq.com</a>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mr-4">
                <Building2 className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Business Inquiries</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">For enterprise plans, partnerships, and press.</p>
                <a href="mailto:sales@clauseiq.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">sales@clauseiq.com</a>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mr-4">
                <MapPin className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Office</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Clause IQ Inc.<br />
                  548 Market St, Suite 12345<br />
                  San Francisco, CA 94104
                </p>
              </div>
            </div>
          </div>

          {/* Quick FAQ / Info Box */}
          <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-slate-400" />
              Response Time
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
              We are a small, dedicated team. We typically respond to all inquiries within <strong>24 hours</strong> during business days (Mon-Fri, 9am - 5pm PT).
            </p>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-slate-400" />
              Common Questions
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2"></span>
                  Pricing & Plans
                </a>
              </li>
              <li>
                <a href="/refund-policy" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2"></span>
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2"></span>
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};