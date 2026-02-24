import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnalysisResult, RiskLevel } from '../types';
import { 
  AlertTriangle, CheckCircle, AlertOctagon, ArrowRight, FileText, Quote, 
  CheckCircle2, ShieldAlert, DollarSign, Clock, PlayCircle, Scale, ListPlus, 
  Handshake, UserCircle2, Printer, Share2, Info, Siren, Eye, Briefcase, Gavel,
  ChevronDown, ChevronUp, Download, Copy
} from 'lucide-react';
import { ContractChat } from '../components/ContractChat';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind class merging
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const ScoreGauge = ({ score }: { score: number }) => {
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

  let color = "#10b981"; // Green (Safe)
  if (score < 80) color = "#facc15"; // Yellow (Caution)
  if (score < 60) color = "#f97316"; // Orange (High Attention)
  if (score < 40) color = "#ef4444"; // Red (Critical)

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
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
        <span className={cn("text-4xl font-bold tracking-tighter leading-none", 
          score >= 80 ? "text-emerald-600" :
          score >= 60 ? "text-yellow-500" :
          score >= 40 ? "text-orange-500" : "text-red-500"
        )}>{score}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
      </div>
    </div>
  );
};

const RiskBreakdownChart = ({ data }: { data: any[] }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            interval={0}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={
                entry.score >= 80 ? '#10b981' : 
                entry.score >= 60 ? '#facc15' : 
                entry.score >= 40 ? '#f97316' : '#ef4444'
              } />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AnalysisResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as AnalysisResult | undefined;
  const contractText = location.state?.contractText as string | undefined;
  
  const [activeTab, setActiveTab] = useState<'summary' | 'risks' | 'clauses'>('summary');

  if (!result) return <Navigate to="/dashboard" />;

  const handlePrint = () => {
    window.print();
  };

  // Prepare data for charts
  const categoryData = result.categoryScores?.map(c => ({
    name: c.category.replace(' & ', '\n& '), // Break long labels
    score: c.score,
    fullCategory: c.category
  })) || [];

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      
      {/* Top Navigation Bar (Simulated) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
              Contract Analysis Result
            </h1>
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border", 
              result.score >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              result.score >= 60 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
              result.score >= 40 ? "bg-orange-50 text-orange-700 border-orange-200" :
              "bg-red-50 text-red-700 border-red-200"
            )}>
              {result.score >= 80 ? "Low Risk" : result.score >= 60 ? "Moderate Risk" : result.score >= 40 ? "High Risk" : "Critical Risk"}
            </span>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={handlePrint} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <Printer className="h-5 w-5" />
             </button>
             <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <Share2 className="h-5 w-5" />
             </button>
             <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                Export PDF
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* SECTION 1: EXECUTIVE SNAPSHOT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Score Card */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Total Risk Score</h3>
             <ScoreGauge score={result.score} />
             <div className="mt-4 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {result.score >= 80 ? "This contract is generally safe." : 
                   result.score >= 60 ? "Contains some negotiable risks." : 
                   "Requires significant revision."}
                </p>
             </div>
          </div>

          {/* Key Details & Breakdown */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col">
             <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Risk Breakdown</h3>
                  <p className="text-sm text-slate-500">Analysis by category weight</p>
                </div>
                <div className="flex space-x-4 text-xs font-medium text-slate-500">
                   <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>Safe</div>
                   <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>Caution</div>
                   <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>Critical</div>
                </div>
             </div>
             <div className="flex-1 min-h-[200px]">
                {categoryData.length > 0 ? (
                  <RiskBreakdownChart data={categoryData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">No category data available</div>
                )}
             </div>
          </div>
        </div>

        {/* SECTION 5: DECISION ENGINE (Moved up for visibility) */}
        {result.decision && (
          <div className={cn("rounded-2xl border p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6",
            result.decision.color === 'Green' ? "bg-emerald-50 border-emerald-200" :
            result.decision.color === 'Yellow' ? "bg-yellow-50 border-yellow-200" :
            result.decision.color === 'Orange' ? "bg-orange-50 border-orange-200" :
            "bg-red-50 border-red-200"
          )}>
             <div className={cn("p-4 rounded-full shrink-0", 
                result.decision.color === 'Green' ? "bg-emerald-100 text-emerald-600" :
                result.decision.color === 'Yellow' ? "bg-yellow-100 text-yellow-600" :
                result.decision.color === 'Orange' ? "bg-orange-100 text-orange-600" :
                "bg-red-100 text-red-600"
             )}>
                {result.decision.color === 'Green' ? <CheckCircle className="h-8 w-8" /> : <AlertOctagon className="h-8 w-8" />}
             </div>
             <div className="flex-1">
                <h3 className={cn("text-xl font-bold mb-2",
                   result.decision.color === 'Green' ? "text-emerald-900" :
                   result.decision.color === 'Yellow' ? "text-yellow-900" :
                   result.decision.color === 'Orange' ? "text-orange-900" :
                   "text-red-900"
                )}>
                  Recommendation: {result.decision.status}
                </h3>
                <div className="space-y-2 mb-4">
                   {result.decision.reasoning.map((reason, i) => (
                      <div key={i} className="flex items-start">
                         <div className={cn("w-1.5 h-1.5 rounded-full mt-2 mr-2 shrink-0", 
                            result.decision.color === 'Green' ? "bg-emerald-500" : "bg-red-500"
                         )}></div>
                         <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{reason}</p>
                      </div>
                   ))}
                </div>
                {result.decision.financialRiskEstimate && (
                   <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/50 border border-black/5 text-sm font-bold text-slate-700">
                      <DollarSign className="h-4 w-4 mr-1.5 text-slate-500" />
                      Est. Financial Exposure: {result.decision.financialRiskEstimate}
                   </div>
                )}
             </div>
             <div className="text-center md:text-right shrink-0">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{result.decision.confidenceScore}%</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Confidence</div>
             </div>
          </div>
        )}

        {/* TABS */}
        <div className="border-b border-slate-200 dark:border-slate-800">
           <nav className="-mb-px flex space-x-8">
              <button 
                onClick={() => setActiveTab('summary')}
                className={cn("whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm", 
                  activeTab === 'summary' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                Professional Summary
              </button>
              <button 
                onClick={() => setActiveTab('risks')}
                className={cn("whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm", 
                  activeTab === 'risks' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                Critical Risks ({result.topRisks?.length || 0})
              </button>
              <button 
                onClick={() => setActiveTab('clauses')}
                className={cn("whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm", 
                  activeTab === 'clauses' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                Category Details
              </button>
           </nav>
        </div>

        {/* TAB CONTENT */}
        <div className="min-h-[400px]">
           
           {/* SUMMARY TAB */}
           {activeTab === 'summary' && result.professionalSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-reveal">
                 <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-blue-500" /> Overview
                       </h3>
                       <dl className="space-y-4 text-sm">
                          <div>
                             <dt className="text-slate-500">Nature of Agreement</dt>
                             <dd className="font-medium text-slate-900 dark:text-slate-200">{result.professionalSummary.overview.natureOfAgreement}</dd>
                          </div>
                          <div>
                             <dt className="text-slate-500">Parties Involved</dt>
                             <dd className="font-medium text-slate-900 dark:text-slate-200">{result.professionalSummary.overview.partiesInvolved.join(', ')}</dd>
                          </div>
                          <div>
                             <dt className="text-slate-500">Duration</dt>
                             <dd className="font-medium text-slate-900 dark:text-slate-200">{result.professionalSummary.overview.duration}</dd>
                          </div>
                          <div>
                             <dt className="text-slate-500">Core Purpose</dt>
                             <dd className="font-medium text-slate-900 dark:text-slate-200">{result.professionalSummary.overview.corePurpose}</dd>
                          </div>
                       </dl>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-emerald-500" /> Commercial Terms
                       </h3>
                       <dl className="space-y-4 text-sm">
                          <div>
                             <dt className="text-slate-500">Payment Terms</dt>
                             <dd className="font-medium text-slate-900 dark:text-slate-200">{result.professionalSummary.commercialTerms.paymentTerms}</dd>
                          </div>
                          <div>
                             <dt className="text-slate-500">Deliverables</dt>
                             <dd className="font-medium text-slate-900 dark:text-slate-200">{result.professionalSummary.commercialTerms.deliverables}</dd>
                          </div>
                          <div>
                             <dt className="text-slate-500">Service Scope</dt>
                             <dd className="font-medium text-slate-900 dark:text-slate-200">{result.professionalSummary.commercialTerms.serviceScope}</dd>
                          </div>
                       </dl>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                          <ShieldAlert className="h-4 w-4 mr-2 text-red-500" /> Risk Highlights
                       </h3>
                       <div className="space-y-4 text-sm">
                          <div>
                             <span className="text-slate-500 block mb-1">Major Risks</span>
                             <ul className="list-disc list-inside space-y-1 text-slate-900 dark:text-slate-200 font-medium">
                                {result.professionalSummary.riskHighlights.majorRisks.map((r, i) => (
                                   <li key={i}>{r}</li>
                                ))}
                             </ul>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                <span className="text-xs text-slate-500 block">Financial Exposure</span>
                                <span className="font-bold text-slate-900 dark:text-white">{result.professionalSummary.riskHighlights.financialExposure}</span>
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                <span className="text-xs text-slate-500 block">Legal Exposure</span>
                                <span className="font-bold text-slate-900 dark:text-white">{result.professionalSummary.riskHighlights.legalExposure}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {result.professionalSummary.missingProtections && result.professionalSummary.missingProtections.length > 0 && (
                       <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm">
                          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-4 flex items-center">
                             <ListPlus className="h-4 w-4 mr-2" /> Missing Protections
                          </h3>
                          <ul className="space-y-2">
                             {result.professionalSummary.missingProtections.map((item, i) => (
                                <li key={i} className="flex items-start text-sm text-amber-800 dark:text-amber-300">
                                   <span className="mr-2">•</span> {item}
                                </li>
                             ))}
                          </ul>
                       </div>
                    )}
                 </div>
              </div>
           )}

           {/* RISKS TAB */}
           {activeTab === 'risks' && (
              <div className="space-y-6 animate-reveal">
                 {result.topRisks?.map((risk, index) => (
                    <div key={index} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                          <div>
                             <div className="flex items-center space-x-3 mb-1">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getRiskColor(risk.severity))}>
                                   {risk.severity} Severity
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{risk.riskType}</span>
                             </div>
                             <h3 className="text-lg font-bold text-slate-900 dark:text-white">{risk.title}</h3>
                          </div>
                          <div className="md:text-right">
                             <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {risk.reference || "General"}
                             </span>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Impact</span>
                             <p className="text-sm text-slate-700 dark:text-slate-300">{risk.impact}</p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/20">
                             <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest block mb-2">Worst Case</span>
                             <p className="text-sm text-red-800 dark:text-red-200 font-medium">{risk.worstCase}</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
                             <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Recommendation</span>
                             <p className="text-sm text-blue-800 dark:text-blue-200 font-bold">{risk.action}</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}

           {/* CLAUSES / CATEGORIES TAB */}
           {activeTab === 'clauses' && (
              <div className="space-y-6 animate-reveal">
                 {result.categoryScores?.map((cat, index) => (
                    <div key={index} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                       <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                          <div>
                             <h3 className="text-base font-bold text-slate-900 dark:text-white">{cat.category}</h3>
                             <p className="text-xs text-slate-500">Weight: {cat.weight}%</p>
                          </div>
                          <div className="flex items-center space-x-4">
                             <div className="text-right">
                                <span className={cn("text-xl font-bold", 
                                   cat.score >= 80 ? "text-emerald-600" : 
                                   cat.score >= 60 ? "text-yellow-600" : "text-red-600"
                                )}>{cat.score}</span>
                                <span className="text-xs text-slate-400 block">/ 100</span>
                             </div>
                          </div>
                       </div>
                       <div className="p-6">
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">{cat.reasoning}</p>
                          {cat.relevantClauses.length > 0 && (
                             <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Relevant Clauses</span>
                                {cat.relevantClauses.map((clause, i) => (
                                   <div key={i} className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 italic">
                                      "{clause}"
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           )}

        </div>

        {/* Chat Component */}
        <div className="print:hidden">
           {contractText && <ContractChat contractText={contractText} />}
        </div>

      </div>
    </div>
  );
};
