import React from 'react';
import { Lock, Shield, Server, ArrowLeft, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
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
              <Shield className="h-6 w-6 text-slate-900 dark:text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Last Updated: October 26, 2024</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-300">
          
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
            <p>
              Clause IQ ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you use our web application.
            </p>
            <p>
              We prioritize the confidentiality of your legal documents. Our core philosophy is <strong>privacy by design</strong>.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <Server className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">In-Memory Processing</h3>
              <p className="text-sm">
                Your contracts are processed in temporary memory. Once the analysis session ends, the document content is discarded. We do not permanently store your uploads unless you explicitly ask to save them.
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <EyeOff className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">No AI Training</h3>
              <p className="text-sm">
                We do <strong>NOT</strong> use your contracts to train our AI models. Your confidential business data remains yours and does not benefit other users or future models.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Personal Data:</strong> We may collect personally identifiable information, such as your name and email address, only when you register for an account.</li>
              <li><strong>Document Data:</strong> We temporarily process the text content of files you upload (PDF, DOCX, Images) to provide the analysis service.</li>
              <li><strong>Usage Data:</strong> We may collect anonymous information about how you access and use the Service (e.g., browser type, time spent on pages) to improve user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Provide, operate, and maintain our Service.</li>
              <li>Process your specific requests for contract analysis.</li>
              <li>Manage your account and login credentials.</li>
              <li>Send you administrative information, such as updates to terms.</li>
              <li>Prevent fraudulent or illegal activity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Encryption:</strong> Data is encrypted in transit using SSL/TLS protocols.</li>
              <li><strong>Ephemeral Storage:</strong> Analyzed text is purged from our processing servers immediately after the response is generated.</li>
              <li><strong>Access Control:</strong> Access to analytical logs is strictly restricted to authorized personnel.</li>
            </ul>
            <p className="mt-4 text-sm italic">
              While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Third-Party Services</h2>
            <p>
              We utilize third-party AI providers (Google Gemini API) to perform text analysis.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Data sent to these providers is subject to their enterprise data privacy policies.</li>
              <li>We configure our API usage to opt-out of data retention for training purposes where available.</li>
              <li>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties for marketing purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">6. Your Data Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>The right to access</strong> – You have the right to request copies of your personal data.</li>
              <li><strong>The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate.</li>
              <li><strong>The right to erasure</strong> – You have the right to request that we erase your personal data account.</li>
            </ul>
          </section>

          <section className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
            <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
            <a href="mailto:privacy@clauseiq.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">privacy@clauseiq.com</a>
          </section>

        </div>
      </div>
    </div>
  );
};