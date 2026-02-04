import React from 'react';
import { Shield, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
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
              <FileText className="h-6 w-6 text-slate-900 dark:text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Last Updated: October 26, 2024</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-300">
          
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to Clause IQ ("Company", "we", "our", "us"). By accessing or using our AI-powered contract analysis tool (the "Service"), 
              you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">2. IMPORTANT: Not Legal Advice</h2>
                <p className="text-sm font-medium text-amber-900/80 dark:text-amber-100/80 mb-2">
                  Clause IQ is a technology tool, NOT a law firm. We do not provide legal advice, legal representation, or lawyer referrals.
                </p>
                <ul className="list-disc ml-4 space-y-1 text-sm text-amber-900/80 dark:text-amber-100/80">
                  <li><strong>No Attorney-Client Relationship:</strong> Use of our Service does not create an attorney-client relationship between you and Clause IQ.</li>
                  <li><strong>AI Limitations:</strong> Our AI analysis is probabilistic. It may hallucinate, misinterpret context, or miss critical clauses.</li>
                  <li><strong>Professional Consultation:</strong> You should always consult with a qualified attorney licensed in your jurisdiction before signing any legal document.</li>
                  <li><strong>Responsibility:</strong> You are solely responsible for your own legal decisions and the consequences of signing any contract.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Use of Service</h2>
            <p className="mb-4">
              You are granted a non-exclusive, non-transferable, revocable license to use the Service strictly in accordance with these Terms.
            </p>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">You agree NOT to:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the Service for any unlawful purpose or to solicit the performance of any illegal activity.</li>
              <li>Attempt to reverse engineer, decompile, or disassemble any aspect of the Service.</li>
              <li>Share your account credentials with third parties.</li>
              <li>Upload documents containing classified government information, illegal content, or malicious code.</li>
              <li>Scrape or automatically harvest data from the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding content provided by you), features, and functionality are and will remain the exclusive property of Clause IQ and its licensors.
            </p>
            <p className="mt-4">
              <strong>Your Data:</strong> You retain all rights to the documents you upload. We claim no ownership over your contracts. By uploading, you grant us a limited license to process the document solely for the purpose of providing the analysis to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Limitation of Liability</h2>
            <p className="uppercase text-sm font-bold mb-2 tracking-wide">READ THIS CAREFULLY:</p>
            <p>
              IN NO EVENT SHALL CLAUSE IQ, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (III) ANY CONTENT OBTAINED FROM THE SERVICE; AND (IV) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">6. Disclaimer</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">7. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">8. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of [Insert Jurisdiction, e.g., Delaware, USA], without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">9. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <a href="mailto:legal@clauseiq.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">legal@clauseiq.com</a>
          </section>

        </div>
      </div>
    </div>
  );
};