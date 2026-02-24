import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnalysisResult, RiskLevel } from '../types';
import { AlertTriangle, CheckCircle, AlertOctagon, ArrowRight, FileText, Quote, CheckCircle2, ShieldAlert, DollarSign, Clock, PlayCircle, Scale, ListPlus, Handshake, UserCircle2, Printer, Share2, Info, Siren, Eye, Briefcase, Gavel } from 'lucide-react';
import { ContractChat } from '../components/ContractChat';

const ScoreRing = ({ score }: { score: number }) => {
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const progress = score / 100;
      setOffset(circumference * (1 - progress));
    }, 500);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  // Updated Logic: High Score (80-100) is GOOD/GREEN. Low Score (0-40) is BAD/RED.
  let color = "#10b981"; // emerald (Safe/Standard)
  
  if (score < 80) { color = "#f59e0b"; } // amber
  if (score < 60) { color = "#f97316"; } // orange
  if (score < 40) { color = "#ef4444"; } // red

  return (
    <div className="relative flex items-center justify-center w-56 h-56">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 160 160">
        <circle 
          cx="80" 
          cy="80" 
          r={normalizedRadius} 
          stroke="currentColor" 
          strokeWidth={stroke} 
          fill="transparent" 
          className="text-slate-100 dark:text-slate-800" 
        />
        <circle 
          cx="80" 
          cy="80" 
          r={normalizedRadius} 
          stroke={color} 
          strokeWidth={stroke} 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none">{score}</span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Fairness Score</span>
      </div>
    </div>
  );
};

export const AnalysisResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as AnalysisResult | undefined;
  const contractText = location.state?.contractText as string | undefined;
  
  // Toggle for Business (Simple) vs Legal (Detailed/Technical) view
  const [viewMode, setViewMode] = useState<'business' | 'legal'>('business');

  if (!result) return <Navigate to="/dashboard" />;

  const parseSummary = (summary: string) => {
    // If it has newlines, assume it's already formatted or a list
    if (summary.includes('\n')) {
      return summary.split('\n').filter(s => s.trim().length > 0);
    }
    // Otherwise split by sentences
    return summary.split('. ').filter(s => s.trim().length > 0).map(s => s.endsWith('.') ? s : s + '.');
  };

  const summaryPoints = parseSummary(result.executiveSummary);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-reveal font-sans print:py-4 print:px-0 pb-32">
      
      {/* Include the Chat Component if text is available */}
      <div className="print:hidden">
         {contractText && <ContractChat contractText={contractText} />}
      </div>

      {/* Header with Coverage Check */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-reveal print:mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Decision Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Financial and Operational Analysis</p>
        </div>
        <div className="flex items-center gap-4 print:hidden">
           {/* View Toggle */}
           <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setViewMode('business')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'business' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Business</span>
              </button>
              <button 
                onClick={() => setViewMode('legal')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'legal' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Gavel className="h-4 w-4" />
                <span>Legal</span>
              </button>
           </div>

           <button 
             onClick={handlePrint}
             className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 transition-all shadow-sm"
             title="Print Report"
           >
             <Printer className="h-5 w-5" />
           </button>
           
           {result.coverage && (
              <div className="hidden lg:flex items-center space-x-4">
                 {result.confidence === 'Low' && (
                    <div className="flex items-center bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-2">
                       <AlertOctagon className="h-4 w-4 mr-2 text-red-500" />
                       <span className="text-xs font-bold text-red-600 dark:text-red-400">Low Confidence</span>
                    </div>
                 )}
                 <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-3 shadow-sm">
                    <CheckCircle2 className={`h-5 w-5 mr-3 ${result.coverage.isComplete ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <div className="hidden sm:block">
                       <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Integrity Check</p>
                       <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{result.coverage.sectionsCovered} Sections Processed</p>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
        
        {/* Left Column: Verdict & Actions */}
        <div className="lg:col-span-4 space-y-8 animate-reveal stagger-1 print:col-span-12 print:grid print:grid-cols-2 print:gap-8">
          
          {/* Score Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] print:border print:shadow-none break-inside-avoid">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Business Verdict</h3>
            <ScoreRing score={result.score} />
            
            {/* Auto-detected Perspective Badge */}
            <div className="mt-4 flex items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700 print:bg-white print:border-slate-200">
              <UserCircle2 className="h-3 w-3 mr-1.5 text-slate-500 dark:text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Perspective: <span className="text-slate-800 dark:text-slate-200">{result.analyzedRole || 'Recipient'}</span>
              </span>
            </div>

            <div className="mt-6">
              <div className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest border-2 ${
                result.verdict === 'Market-Standard' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' :
                result.verdict === 'High Risk' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800' :
                'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800'
              }`}>
                {result.verdict}
              </div>
            </div>
            
            {/* Score Legend */}
            <div className="mt-6 w-full text-left bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 print:hidden">
               <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 mb-2">
                  <span>Score Guide</span>
               </div>
               <div className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between">
                     <span className="text-emerald-600 dark:text-emerald-400">80-100</span>
                     <span className="text-slate-500 dark:text-slate-400">Standard / Friendly</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-amber-600 dark:text-amber-400">60-79</span>
                     <span className="text-slate-500 dark:text-slate-400">Negotiable</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-orange-600 dark:text-orange-400">40-59</span>
                     <span className="text-slate-500 dark:text-slate-400">Risky / One-sided</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-red-600 dark:text-red-400">0-39</span>
                     <span className="text-slate-500 dark:text-slate-400">Highly Exploitative</span>
                  </div>
               </div>
            </div>

            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 font-medium px-4 print:text-[10px]">
              {result.marketComparison || "Compared to standard market norms."}
            </p>
          </div>

          <div className="print:contents">
            {/* Negotiation Moves - Quick List */}
            {result.negotiationMoves && result.negotiationMoves.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-[32px] border border-blue-100 dark:border-blue-900/30 p-8 print:border print:rounded-xl break-inside-avoid">
                 <div className="flex items-center mb-4">
                   <Handshake className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                   <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">Negotiation Moves</h3>
                 </div>
                 <ul className="space-y-3">
                   {result.negotiationMoves.slice(0, 3).map((move, i) => (
                     <li key={i} className="text-sm text-blue-800 dark:text-blue-300 flex items-start">
                       <span className="mr-2">•</span>
                       {move}
                     </li>
                   ))}
                 </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8 space-y-10 animate-reveal stagger-2 print:col-span-12">
          
          {/* Reality Check - If Signed As-Is (New Section) */}
          {result.signedAsIsOutcome && (
             <div className="bg-slate-900 dark:bg-slate-950 rounded-[32px] p-8 md:p-10 shadow-lg border border-slate-800 relative overflow-hidden text-white break-inside-avoid print:bg-white print:border-slate-200 print:text-black">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 print:hidden"></div>
                
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em] mb-6 flex items-center relative z-10 print:text-amber-600">
                   <Eye className="h-4 w-4 mr-3" />
                   Reality Check: If Signed As-Is
                </h2>
                
                <div className="relative z-10">
                   <p className="text-lg md:text-xl font-medium leading-relaxed text-slate-200 print:text-slate-800">
                      {result.signedAsIsOutcome}
                   </p>
                </div>
             </div>
          )}

          {/* Executive Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-[32px] p-10 shadow-lg relative overflow-hidden border border-slate-200 dark:border-slate-700 print:bg-white print:text-black print:border-slate-200 print:shadow-none break-inside-avoid">
             {/* Decorative blob only in dark mode or subtle in light */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 dark:bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 print:hidden"></div>
             
            <h2 className="text-xs font-bold text-blue-600 dark:text-blue-300 print:text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center relative z-10">
              <PlayCircle className="h-4 w-4 mr-3" />
              Strategic Summary
            </h2>
            
            <div className="space-y-4 relative z-10">
               {summaryPoints.map((point, i) => (
                   <div key={i} className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 print:bg-blue-600 mt-2.5 mr-4 shrink-0"></div>
                      <p className="text-slate-700 dark:text-slate-300 print:text-slate-700 text-lg font-medium leading-relaxed">{point.replace(/^- /, '')}</p>
                   </div>
               ))}
            </div>
          </div>

          {/* Factor Analysis Grid */}
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center ml-2">
               <Scale className="h-4 w-4 mr-3 text-slate-900 dark:text-white" />
               Key Business Factors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {result.factors && result.factors.map((factor, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-5 pt-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative print:border-slate-200 break-inside-avoid">
                     <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        factor.status === 'Healthy' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                        factor.status === 'Risky' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                     }`}>{factor.status}</span>

                     <div className="flex items-start space-x-3 pr-10">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                           factor.status === 'Healthy' ? 'bg-emerald-500' : 
                           factor.status === 'Risky' ? 'bg-red-500' : 'bg-slate-300'
                        }`}></div>
                        <div>
                           <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{factor.factor}</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{factor.detail}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>

          {/* Red Flags / Top Risks */}
          {result.topRisks && result.topRisks.length > 0 && (
             <div>
               <div className="flex justify-between items-end mb-6 ml-2">
                  <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center">
                    <ShieldAlert className="h-4 w-4 mr-3 text-red-600 dark:text-red-400" />
                    Critical Red Flags
                  </h2>
               </div>
               
               <div className="space-y-6">
                 {result.topRisks.map((risk, index) => (
                   <div key={index} className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-8 hover:border-red-200 dark:hover:border-red-900 transition-all hover:shadow-lg group break-inside-avoid print:border-slate-200">
                     <div className="flex flex-col">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex flex-col">
                              {viewMode === 'legal' && risk.technicalTerm ? (
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{risk.title}</span>
                              ) : null}
                              <h3 className="font-bold text-slate-900 dark:text-white text-xl leading-tight">
                                {viewMode === 'legal' && risk.technicalTerm ? risk.technicalTerm : risk.title}
                              </h3>
                          </div>
                          {risk.riskType && (
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ml-4">
                                {risk.riskType}
                              </span>
                          )}
                       </div>
                       
                       {viewMode === 'business' ? (
                           /* BUSINESS VIEW CARD */
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                             <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                               <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest block mb-2 flex items-center">
                                  <Siren className="h-3 w-3 mr-1.5" /> Worst Case
                               </span>
                               <p className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-relaxed">{risk.worstCase}</p>
                             </div>
                             
                             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Why it Matters</span>
                               <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{risk.impact}</p>
                             </div>

                             <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                               <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Required Action</span>
                               <p className="text-blue-800 dark:text-blue-200 font-semibold text-sm leading-relaxed">{risk.action}</p>
                             </div>
                           </div>
                       ) : (
                           /* LEGAL VIEW CARD */
                           <div className="space-y-4 mb-6">
                              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center">
                                    <Scale className="h-3 w-3 mr-1.5" /> Market Deviation Analysis
                                 </span>
                                 <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed">
                                    {risk.deviation || "No specific market deviation data available. Clause appears non-standard."}
                                 </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Relevant Clause</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono italic">"{risk.reference}"</p>
                                 </div>
                                 <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-r-xl">
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Recommendation</span>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{risk.action}</p>
                                 </div>
                              </div>
                           </div>
                       )}
   
                       {viewMode === 'business' && risk.reference && (
                          <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 font-medium bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg w-fit">
                             <Quote className="h-3 w-3 mr-2 text-slate-300 dark:text-slate-600" />
                             <span>Source: <span className="text-slate-500 dark:text-slate-400 italic">"{risk.reference}"</span></span>
                          </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {/* Missing Clauses */}
          {result.missingClauses && result.missingClauses.length > 0 && (
            <div className="break-inside-avoid">
               <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center ml-2">
                 <ListPlus className="h-4 w-4 mr-3 text-amber-600 dark:text-amber-400" />
                 Missing Protections
               </h2>
               <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[28px] p-8 print:border-slate-200">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium">
                     The following standard protections for your role are suspiciously absent:
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {result.missingClauses.map((clause, i) => (
                        <li key={i} className="flex items-center text-amber-900 dark:text-amber-200 font-semibold text-sm">
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-3"></div>
                           {clause}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
          )}
        
        {/* Legal Disclaimer Footer */}
        <div className="mt-12 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start print:mt-8 break-inside-avoid">
            <Info className="h-5 w-5 text-slate-400 mr-4 mt-0.5 shrink-0" />
            <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Clause IQ is NOT a law firm</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This analysis is generated by AI for informational business intelligence purposes only. It is probabilistic and may contain errors. 
                    It does not constitute legal advice, legal representation, or a replacement for a qualified attorney. 
                    You should always consult with legal counsel before signing binding agreements.
                </p>
            </div>
        </div>

        </div>
      </div>
      
      {/* Contract in Plain English Button */}
      {result.contractSummary && (
        <div className="mt-12 text-center animate-reveal stagger-3 print:hidden">
            <button 
                onClick={() => navigate('/walkthrough', { state: { summary: result.contractSummary, clauses: result.clauses } })}
                className="w-full md:w-auto mx-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] py-6 px-12 font-bold text-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center group"
              >
                <span className="mr-3">Read Plain English Summary</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-slate-400 text-sm mt-4 font-medium">Business contract summary • Money • Obligations • Exit</p>
        </div>
      )}

    </div>
  );
};