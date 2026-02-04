import React, { useState } from 'react';
import { Scale, X, Check, Zap, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialView = 'login' }) => {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  
  const [emailInput, setEmailInput] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialView === 'signup');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !agreedToTerms) {
      setAuthMessage("You must agree to the Terms of Service.");
      return;
    }

    if (emailInput.trim()) {
      setIsLoggingIn(true);
      setAuthMessage(null);
      const { error } = await loginWithEmail(emailInput);
      setIsLoggingIn(false);
      if (error) setAuthMessage(`Error: ${error}`);
      else setStep('success');
    }
  };

  const handleGoogleLogin = async () => {
    if (isSignUp && !agreedToTerms) {
        setAuthMessage("You must agree to the Terms of Service.");
        return;
    }
    setAuthMessage(null);
    setIsLoggingIn(true);
    const { error } = await loginWithGoogle();
    if (error) {
      setAuthMessage(`Google Login Error: ${error}`);
      setIsLoggingIn(false);
    }
  };

  const toggleView = () => {
    setIsSignUp(!isSignUp);
    setAuthMessage(null);
    setStep('form');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-reveal">
        <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-slate-400 p-2 z-50">
            <X className="h-6 w-6" />
        </button>

        <div className="hidden md:flex flex-col justify-between w-2/5 bg-slate-50 dark:bg-slate-950/50 p-10 border-r border-slate-100 dark:border-slate-800">
           <div>
              <div className="flex items-center space-x-2 mb-8">
                 <div className="p-2 bg-blue-600 rounded-lg"><Scale className="h-6 w-6 text-white" /></div>
                 <span className="font-bold text-xl text-slate-900 dark:text-white">Clause IQ</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">{isSignUp ? "Sign with confidence." : "Welcome back."}</h2>
              <div className="space-y-4">
                 {["Instant Risk Analysis", "Market Benchmarking", "Secure Processing"].map((item, i) => (
                    <div key={i} className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                       <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400"><Check className="h-3.5 w-3.5" /></div>
                       {item}
                    </div>
                 ))}
              </div>
           </div>
           <div className="text-xs text-slate-400 font-medium">© 2024 Clause IQ Inc.</div>
        </div>

        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative">
           <button onClick={onClose} className="absolute top-6 right-6 hidden md:block text-slate-300 hover:text-slate-500 transition-colors"><X className="h-6 w-6" /></button>

           {step === 'success' ? (
              <div className="text-center animate-fade-in py-10">
                 <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6"><Mail className="h-10 w-10 text-emerald-600 dark:text-emerald-400" /></div>
                 <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check your inbox!</h3>
                 <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-8">Login link sent to <span className="font-bold">{emailInput}</span>.</p>
                 <button onClick={onClose} className="text-blue-600 font-bold hover:underline">Close Window</button>
              </div>
           ) : (
             <>
               <div className="md:hidden mb-8 text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
               </div>

               <div className="space-y-4 mb-8">
                 <button onClick={handleGoogleLogin} className="w-full py-3.5 px-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold flex items-center justify-center text-slate-700 dark:text-white group">
                   <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                   {isSignUp ? 'Sign up with Google' : 'Continue with Google'}
                 </button>

                 <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or via Email</span>
                    <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                 </div>

                 <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" placeholder="name@company.com" />
                    {isSignUp && (
                        <div className="flex items-start space-x-3 p-1">
                            <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                            <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer">I agree to the <a href="/terms" className="text-blue-600 underline">Terms</a> and <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.</label>
                        </div>
                    )}
                    <button type="submit" disabled={isLoggingIn} className="w-full gradient-bg text-white font-bold py-4 rounded-xl hover:opacity-90 shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center">
                        {isLoggingIn ? <Zap className="h-4 w-4 mr-2 animate-pulse" /> : <ArrowRight className="h-4 w-4 ml-2" />}
                        {isLoggingIn ? "Sending..." : (isSignUp ? 'Create Free Account' : 'Send Magic Link')}
                    </button>
                 </form>
                 {authMessage && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg text-center animate-shake">{authMessage}</div>}
               </div>

               <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                     {isSignUp ? "Already have an account?" : "No account yet?"}{' '}
                     <button onClick={toggleView} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">{isSignUp ? "Log in" : "Sign up"}</button>
                  </p>
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};