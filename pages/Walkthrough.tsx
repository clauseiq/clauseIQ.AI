import React from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ContractSummary, ClauseBreakdown, RiskLevel } from '../types';
import { ArrowLeft, CheckCircle2, DollarSign, LogOut, ShieldAlert, Scale, ChevronDown, ChevronUp } from 'lucide-react';

export const Walkthrough: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const summary = location.state?.summary as ContractSummary | undefined;
  // Fallback for old analyses without summary
  const clauses = location.state?.clauses as ClauseBreakdown[] | undefined;

  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);

  if (!summary && !clauses) {
    return <Navigate to="/dashboard" />;
  }

  // --- LEGACY CLAUSE VIEW (Fallback) ---
  if (!summary && clauses) {
    const toggleClause = (index: number) => setExpandedIndex(expandedIndex === index ? null : index);
    const getRiskColor = (level: RiskLevel) => {
        switch (level) {
          case RiskLevel.HIGH: return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
          case RiskLevel.MEDIUM: return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
          case RiskLevel.LOW: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
          default: return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
        }
    };
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-reveal font-sans">
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Results
          </button>
          <div className="mb-8"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Contract Clauses</h1></div>
          <div className="space-y-4">
            {clauses.map((clause, index) => (
              <div key={index} className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 overflow-hidden ${expandedIndex === index ? 'shadow-md border-blue-200 dark:border-blue-900' : 'shadow-sm border-slate-200 dark:border-slate-800'}`}>
                <button onClick={() => toggleClause(index)} className="w-full text-left px-6 py-4 flex justify-between items-center focus:outline-none">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-3 mb-1">
                       <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getRiskColor(clause.riskLevel)}`}>{clause.riskLevel} Risk</span>
                       <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Clause {index + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{clause.title || clause.explanation.split('.')[0]}</h3>
                  </div>
                  {expandedIndex === index ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
                {expandedIndex === index && (
                  <div className="px-6 pb-6 pt-0 animate-fade-in">
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                       <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-2">Plain English Summary</h4>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">{clause.explanation}</p>
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-2">Original Text</h4>
                          <div className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap max-h-[500px] overflow-y-auto">{clause.originalText}</div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
    );
  }

  // --- NEW SUMMARY VIEW ---
  if (!summary) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-reveal font-sans">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors font-medium"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="text-center mb-12">
         <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-slate-800 rounded-2xl mb-6">
            <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
         </div>
         <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Contract in Plain English</h1>
         <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            A comprehensive business intelligence summary of what you are actually signing.
         </p>
      </div>

      <div className="space-y-8">
         
         {/* 1. Executive Summary */}
         <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Executive Summary</h2>
            <p className="text-lg md:text-xl text-slate-900 dark:text-white leading-relaxed font-medium">
               {summary.executiveSummary}
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 2. Obligations */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
               <div className="flex items-center mb-6">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mr-3">
                     <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Obligations</h2>
               </div>
               <ul className="space-y-4 flex-grow">
                  {summary.obligations.map((item, i) => (
                     <li key={i} className="flex items-start text-slate-700 dark:text-slate-300">
                        <span className="mr-3 mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                        <span className="leading-relaxed">{item}</span>
                     </li>
                  ))}
               </ul>
            </div>

            {/* 3. Rights & Benefits */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
               <div className="flex items-center mb-6">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mr-3">
                     <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">What You Get</h2>
               </div>
               <ul className="space-y-4 flex-grow">
                  {summary.rights.map((item, i) => (
                     <li key={i} className="flex items-start text-slate-700 dark:text-slate-300">
                        <span className="mr-3 mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                        <span className="leading-relaxed">{item}</span>
                     </li>
                  ))}
               </ul>
            </div>
         </div>

         {/* 4. Money & Commercials */}
         <div className="bg-slate-50 dark:bg-slate-950/50 rounded-[32px] p-8 md:p-10 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center mb-6">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg mr-3 shadow-sm">
                   <DollarSign className="h-5 w-5 text-slate-900 dark:text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Money & Commercials</h2>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
               {summary.commercials}
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 5. Exit Strategy */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center mb-6">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                     <LogOut className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">How You Can Exit</h2>
               </div>
               <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {summary.exit}
               </p>
            </div>

            {/* 6. Risk & Liability */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center mb-6">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mr-3">
                     <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Risk & Liability</h2>
               </div>
               <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {summary.risk}
               </p>
            </div>
         </div>

         {/* 7. Power Balance */}
         <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-[32px] p-8 md:p-10 text-white shadow-lg">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Control & Power Balance</h2>
            <p className="text-lg font-medium leading-relaxed opacity-90">
               {summary.powerBalance}
            </p>
         </div>

         {/* 8. Top 3 Takeaways */}
         <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-[32px] p-8 md:p-10 border border-indigo-100 dark:border-indigo-900/30">
            <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-200 mb-8">3 Things To Know Before Signing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {summary.top3Takeaways.map((takeaway, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-indigo-50 dark:border-indigo-900/20 relative">
                     <div className="absolute -top-4 -left-2 text-4xl font-bold text-indigo-100 dark:text-indigo-900/40 select-none">
                        {i + 1}
                     </div>
                     <p className="text-slate-700 dark:text-slate-300 font-medium relative z-10 leading-relaxed">
                        {takeaway}
                     </p>
                  </div>
               ))}
            </div>
         </div>

      </div>
    </div>
  );
};