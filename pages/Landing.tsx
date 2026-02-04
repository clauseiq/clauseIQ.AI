import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Scale, Shield, Lock, CheckCircle2, Zap, ArrowRight, FileText, AlertOctagon, TrendingDown, Clock, Ban, ChevronDown, ChevronUp, Search, DollarSign, BrainCircuit, Globe } from 'lucide-react';

const RevealOnScroll: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      {children}
    </div>
  );
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Auto-redirect to dashboard if logged in
  useEffect(() => {
    if (isAuthenticated) {
        navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientY / innerHeight - 0.5) * 10;
    const y = (clientX / innerWidth - 0.5) * -10;
    setRotate({ x, y });
  };

  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    {
      icon: DollarSign,
      title: "Financial Exposure Check",
      desc: "Spot uncapped indemnities, hidden fees, and payment traps that directly hit your bank account."
    },
    {
      icon: BrainCircuit,
      title: "Decision Logic, Not Legal Ops",
      desc: "We don't give you 50 redlines. We give you a 'Safe', 'Negotiate', or 'Walk Away' verdict."
    },
    {
      icon: Globe,
      title: "Market Benchmarking",
      desc: "Instant comparison against standard terms in your jurisdiction. Know if you're being bullied."
    },
    {
      icon: Search,
      title: "Plain English Translation",
      desc: "Hover over any complex clause to see exactly what it means for your business operations."
    },
    {
      icon: Lock,
      title: "Vendor Lock-in Detection",
      desc: "Identify auto-renewals, termination fees, and non-competes that restrict your future freedom."
    },
    {
      icon: Zap,
      title: "Instant Turnaround",
      desc: "Stop waiting 4 days for outside counsel. Get a comprehensive risk audit in under 60 seconds."
    }
  ];

  const faqs = [
    {
      q: "Is this legal advice?",
      a: "No. Clause IQ is a business intelligence tool. We highlight financial and operational risks so you can make informed decisions or know when to call a lawyer. We do not provide legal counsel."
    },
    {
      q: "Is my data secure?",
      a: "Yes. We process your documents in memory using enterprise-grade encryption. We do not train our models on your specific contracts, and documents are discarded after the session ends unless you explicitly save them."
    },
    {
      q: "What types of contracts does it work on?",
      a: "It is optimized for commercial agreements: Service Agreements, SaaS Contracts, NDAs, Employment Offers, and Partnership Agreements. It works best on standard business prose."
    },
    {
      q: "How much does it cost?",
      a: "We offer a free trial that includes 3 full contract analyses. After that, we offer simple monthly pricing for unlimited access. No hidden fees."
    }
  ];

  return (
    <div className="bg-white dark:bg-[#020617] soft-gradient-bg min-h-screen transition-colors duration-300" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Hero */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mb-10 border border-slate-200 dark:border-slate-800 animate-reveal">
            <Zap className="h-3 w-3 mr-2 text-blue-600 fill-blue-600" />
            AI Insight. Not Legal Advice.
          </div>

          <div className="animate-reveal stagger-1">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1]">
              Make Contract Decisions <br className="hidden md:block" />
              <span className="gradient-text">Without The Jargon</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              We translate contracts into business decisions. Clause IQ is an AI engine that spots financial downside and operational risks in minutes. It is NOT a law firm.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6 animate-reveal stagger-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-10 py-5 gradient-bg text-white rounded-full font-bold text-lg hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center group"
            >
              Start Decision Engine
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
                onClick={() => setSearchParams({ signup: 'true' })}
                className="px-10 py-5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:shadow-sm"
            >
              Create Free Account
            </button>
          </div>

          {/* 3D Parallax Application Mockup */}
          <div className="mt-24 parallax-container max-w-5xl mx-auto animate-reveal stagger-3 relative z-10" style={{ perspective: '1200px' }}>
            <div 
              className="parallax-card relative transition-transform duration-100 ease-out"
              style={{ transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` }}
            >
              {/* Main App Window Interface */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 overflow-hidden relative z-10 transition-colors duration-300">
                
                {/* Window Controls & Header */}
                <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  </div>
                  <div className="flex items-center space-x-2 bg-white dark:bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Secure Analysis • Contractor_Agreement_v3.pdf</span>
                  </div>
                  <div className="w-16"></div> 
                </div>

                <div className="flex h-[450px] md:h-[550px] relative">
                   {/* Sidebar */}
                   <div className="w-64 bg-slate-50/50 dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 p-6 hidden md:block">
                      <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded-full mb-8"></div>
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Risks Detected</div>
                         {[
                           { name: "Services", active: false },
                           { name: "IP Rights", active: true, risk: true },
                           { name: "Payment", active: false },
                           { name: "Termination", active: false }
                          ].map((item, i) => (
                           <div key={i} className={`px-4 py-3 rounded-lg border transition-all flex justify-between items-center ${item.active ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900/50 shadow-sm' : 'border-transparent text-slate-400'}`}>
                             <span className={`text-xs font-semibold ${item.active ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{item.name}</span>
                             {item.risk && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Main Document Area */}
                   <div className="flex-1 p-8 md:p-12 bg-white dark:bg-slate-950 relative overflow-hidden flex flex-col">
                      {/* Faint Grid Background */}
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>

                      {/* Fake Document Content */}
                      <div className="space-y-8 max-w-2xl mx-auto w-full">
                        
                        {/* Title Section */}
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                           <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Independent Contractor Agreement</h3>
                           <div className="flex justify-between mt-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                              <span>Date: Oct 24, 2024</span>
                              <span>Party A: Acme Corp</span>
                           </div>
                        </div>

                        {/* Blurred Text Top */}
                        <div className="space-y-3 opacity-30 blur-[0.5px]">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase">1. Services Provided</h4>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="h-2 w-11/12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>

                        {/* Catchy Risky Clause - Clear Text */}
                        <div className="relative group p-6 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/20 dark:bg-red-900/10 transition-colors">
                           <div className="flex items-center space-x-2 mb-3">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">2. Intellectual Property Rights</h4>
                              <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-bold border border-red-200 dark:border-red-800">High Risk</span>
                           </div>
                           <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                             Contractor agrees that all Work Product shall be considered a "work made for hire". 
                             <span className="bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100 px-0.5 rounded box-decoration-clone font-semibold border-b-2 border-red-200 dark:border-red-800">
                               Contractor hereby assigns all rights, including moral rights, in perpetuity to Client, regardless of whether payment has been rendered.
                             </span>
                             This assignment is irrevocable and worldwide.
                           </p>
                           
                           {/* Connecting Line (Decorative) */}
                           <div className="hidden md:block absolute top-1/2 right-0 w-16 h-px bg-red-300 translate-x-full"></div>
                           <div className="hidden md:block absolute top-1/2 right-0 w-2 h-2 rounded-full bg-red-500 translate-x-full translate-y-[-3px] shadow-sm"></div>
                        </div>

                        {/* Blurred Text Bottom */}
                        <div className="space-y-3 opacity-30 blur-[1px]">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase">3. Term and Termination</h4>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                      </div>

                      {/* LAYER 3: Floating Parallax Elements */}
                      
                      {/* Floating Insight Card (Right) */}
                      <div 
                        className="absolute top-[40%] right-6 md:right-10 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.2)] border border-red-100 dark:border-red-900/30 p-5 transform translate-x-4 -translate-y-4" 
                        style={{ transform: 'translateZ(50px)' }}
                      >
                         <div className="flex items-start space-x-4">
                            <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg shadow-red-200 dark:shadow-none">
                               <AlertOctagon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                               <div className="flex justify-between items-center mb-1">
                                 <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Unfair IP Transfer</h4>
                               </div>
                               <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mt-1">
                                 Client claims ownership <b className="text-slate-900 dark:text-white">before</b> paying you.
                               </p>
                               <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                 <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Recommendation</p>
                                 <p className="text-xs text-slate-700 dark:text-slate-300">Add condition: "Upon full payment".</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Floating Score Badge (Top Right) */}
                       <div 
                          className="absolute top-8 right-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-700 p-2 pr-5 flex items-center space-x-3" 
                          style={{ transform: 'translateZ(30px)' }}
                       >
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="24" cy="24" r="20" stroke="#f1f5f9" className="dark:stroke-slate-700" strokeWidth="4" fill="transparent" />
                              <circle cx="24" cy="24" r="20" stroke="#f59e0b" strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset="60" strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-sm font-bold text-slate-800 dark:text-white">48</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Financial Risk</span>
                             <span className="text-xs font-bold text-amber-500">Review Needed</span>
                          </div>
                       </div>
                   </div>
                </div>
              </div>

              {/* Decorative Glows (Behind Card) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/30 dark:bg-blue-900/20 rounded-full blur-[100px] -z-10 mix-blend-multiply dark:mix-blend-screen"></div>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1.5s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Tickers - Updated with Consistent Theme */}
      <section className="py-20 bg-slate-50 dark:bg-[#020617] border-y border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
        <RevealOnScroll className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex items-start space-x-5">
              <div className="p-3 bg-blue-100 dark:bg-slate-800 rounded-2xl">
                <TrendingDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Identify Financial Downside</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">See exactly how a contract affects your bottom line before you sign.</p>
              </div>
            </div>
            <div className="flex items-start space-x-5">
              <div className="p-3 bg-purple-100 dark:bg-slate-800 rounded-2xl">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Spot Operational Bottlenecks</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Avoid clauses that lock you into vendors or restrict your future roadmap.</p>
              </div>
            </div>
            <div className="flex items-start space-x-5">
              <div className="p-3 bg-emerald-100 dark:bg-slate-800 rounded-2xl">
                <Ban className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">No Legal Jargon</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">We strip away the "herewiths" and "therefores" to give you plain English decisions.</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

       {/* Features Grid */}
       <section className="py-24 bg-white dark:bg-[#020617]">
        <RevealOnScroll className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Everything You Need To Sign With Confidence</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Replaces the "Quick Scan" you usually pay a lawyer $500 for.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all hover:shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </section>

      {/* Simplified Steps */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950/50">
        <RevealOnScroll className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Upload. Analyze. Decide.</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Your second set of eyes before sending it to legal.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: FileText, title: 'Upload Draft', desc: 'Securely upload your PDF or Word document. We process it in memory.' },
              { icon: Scale, title: 'Business Analysis', desc: 'Our engine identifies risks to your money, time, and freedom.' },
              { icon: CheckCircle2, title: 'Make a Decision', desc: 'Get a clear Go/No-Go verdict and exact steps for negotiation.' }
            ].map((step, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all hover:shadow-xl hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-xl mb-4 text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-[#020617]">
        <RevealOnScroll className="max-w-3xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center tracking-tight">Common Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 transition-colors">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none"
                >
                  <span className="font-bold text-slate-900 dark:text-white">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 pt-0 animate-reveal">
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </section>

    </div>
  );
};