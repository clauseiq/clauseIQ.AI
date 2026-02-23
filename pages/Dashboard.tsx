import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyzeContract, getQuickAnchor, performOCR } from '../services/geminiService'; // Import performOCR here
import { extractTextFromFile } from '../services/extractionService';
import { Upload, AlertCircle, Lock, X, CheckCircle2, Scale, FileText, ArrowRight, Zap, Loader2, Sparkles } from 'lucide-react';
import { ExtractionMetadata, AnalysisResult } from '../types';
import { SeasonLoader } from '../components/SeasonLoader';
import { UpgradeModal } from '../components/UpgradeModal';
import { useToast } from '../contexts/ToastContext';

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated, incrementUsage, hasAccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [contractText, setContractText] = useState('');
  const [metadata, setMetadata] = useState<ExtractionMetadata | null>(null);
  const [country, setCountry] = useState('United States');
  const [contractType, setContractType] = useState('Service Agreement');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // New State for Immediate Anchor
  const [quickAnchor, setQuickAnchor] = useState<{ riskAnchor: string, verdict: string } | null>(null);
  const [isGettingAnchor, setIsGettingAnchor] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Payment Success Check
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
        toast.success("Payment successful! Your account has been upgraded.");
        setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleGlobalDrop = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) await processFile(files[0]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = '';
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    // Don't set uploadedFile yet. Wait for extraction to finish so the "Extracting..." spinner is shown.
    setIsExtracting(true);
    setContractText('');
    setMetadata(null);
    setAnalysisResult(null); // Reset previous analysis
    setQuickAnchor(null);

    try {
      const result = await extractTextFromFile(file);
      
      // Extraction success - NOW update state to show the "Ready" view
      setContractText(result.text);
      setMetadata(result.metadata);
      setUploadedFile(file);
      toast.success("File processed successfully");

      // IMMEDIATELY TRIGGER QUICK ANCHOR
      if (isAuthenticated) {
        setIsGettingAnchor(true);
        getQuickAnchor(result.text, country, contractType)
          .then(anchor => {
             setQuickAnchor(anchor);
             setIsGettingAnchor(false);
          })
          .catch(err => {
             console.error("Quick anchor failed", err);
             setIsGettingAnchor(false);
             if (err instanceof Error && err.message === "QUOTA_LIMIT_REACHED") {
                setShowUpgradeModal(true);
             } else {
                // Display toast for quick anchor failure
                toast.warning(err instanceof Error ? err.message : "Could not get immediate impression. Try deep scan.");
             }
          });
      }

    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message === "QUOTA_LIMIT_REACHED") {
         setShowUpgradeModal(true);
      } else {
         setError(err instanceof Error ? err.message : "Failed to read file.");
         toast.error("Failed to process file");
      }
      setUploadedFile(null);
      setIsGettingAnchor(false);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!contractText.trim()) { 
      const msg = "Please provide contract text.";
      setError(msg); 
      toast.warning(msg);
      return; 
    }
    if (!isAuthenticated) { setSearchParams({ login: 'true' }); return; }

    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeContract(contractText, country, contractType);
      
      if (activeTab === 'upload') {
        // For upload tab, we show the Analysis Complete Card instead of navigating
        setAnalysisResult(result);
        toast.success("Risk Analysis Complete");
      } else {
        // For paste tab, we navigate immediately like before
        navigate('/result', { state: { result, contractText } });
      }

    } catch (err: any) {
      console.error(err);
      if (err.message === "PLAN_LIMIT_REACHED" || err.message === "QUOTA_LIMIT_REACHED") {
         setShowUpgradeModal(true);
      } else {
         const msg = err instanceof Error ? err.message : "Analysis failed. Please try again.";
         setError(msg);
         toast.error(msg);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewFullReport = () => {
    if (analysisResult) {
      navigate('/result', { state: { result: analysisResult, contractText } });
    }
  };

  const clearFile = () => {
    setUploadedFile(null); setContractText(''); setMetadata(null); setAnalysisResult(null); setQuickAnchor(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('upload');
  };

  return (
    <>
      {isAnalyzing && <SeasonLoader />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      
      <div className="max-w-5xl mx-auto px-6 py-12 animate-reveal">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Contract Decision Engine</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Upload a contract. Get a business risk assessment in 60 seconds.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button onClick={() => setActiveTab('upload')} className={`flex-1 py-5 font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'upload' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>File Upload</button>
            <button onClick={() => setActiveTab('paste')} className={`flex-1 py-5 font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'paste' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Paste Text</button>
          </div>

          <div className="p-8 md:p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center text-red-600 dark:text-red-400 animate-fade-in">
                <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
                <p className="font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* TAB CONTENT: UPLOAD */}
            {activeTab === 'upload' && (
              <>
                {!uploadedFile ? (
                   // 1. EMPTY STATE or EXTRACTING STATE
                   <div 
                     onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                     onClick={() => !isExtracting && fileInputRef.current?.click()}
                     className={`border-3 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${isExtracting ? 'cursor-wait opacity-80' : ''}`}
                   >
                     <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt,image/*" onChange={handleFileSelect} />
                     {isExtracting ? (
                       <div className="text-center">
                          <div className="animate-spin mb-4 text-blue-600 dark:text-blue-400 mx-auto w-10"><Scale className="h-10 w-10" /></div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">Extracting Text...</p>
                       </div>
                     ) : (
                       <>
                         <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400"><Upload className="h-8 w-8" /></div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Click or Drop Contract Here</h3>
                         <p className="text-slate-400 text-sm">Supports PDF, Word, Images (OCR)</p>
                       </>
                     )}
                   </div>
                ) : !analysisResult ? (
                   // 2. FILE READY TO SCAN STATE (With Immediate Anchor)
                   <div className="animate-fade-in text-center py-8">
                      <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        {isGettingAnchor && (
                          <div className="absolute -bottom-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center animate-pulse">
                             Scanning...
                          </div>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{uploadedFile.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-8">{metadata ? `${metadata.pagesDetected} pages detected` : 'Ready to analyze'}</p>
                      
                      {/* --- IMMEDIATE RISK ANCHOR DISPLAY --- */}
                      {(isGettingAnchor || quickAnchor) && (
                         <div className="max-w-xl mx-auto mb-10 animate-slide-up">
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900/50 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 relative overflow-hidden">
                               {isGettingAnchor ? (
                                  <div className="flex flex-col items-center justify-center py-4">
                                     <Sparkles className="h-6 w-6 text-indigo-500 animate-spin mb-3" />
                                     <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Generating initial impression...</p>
                                  </div>
                               ) : quickAnchor ? (
                                  <>
                                     <div className="flex items-center justify-center space-x-2 mb-3">
                                         <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                                            First Impression
                                         </span>
                                         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                                            quickAnchor.verdict === 'Risky' || quickAnchor.verdict === 'Dangerous' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                         }`}>
                                            {quickAnchor.verdict}
                                         </span>
                                     </div>
                                     <p className="text-lg font-bold text-slate-800 dark:text-slate-200 italic leading-relaxed">
                                        "{quickAnchor.riskAnchor}"
                                     </p>
                                  </>
                               ) : null}
                            </div>
                         </div>
                      )}

                      <div className="max-w-md mx-auto space-y-4">
                         <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Jurisdiction</label>
                                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-r-[8px] border-transparent outline outline-1 outline-slate-200 dark:outline-slate-700 text-slate-700 dark:text-white font-medium focus:outline-blue-500 text-sm">
                                  <option value="United States">United States</option>
                                  <option value="United Kingdom">United Kingdom</option>
                                  <option value="Canada">Canada</option>
                                  <option value="European Union">EU</option>
                                  <option value="India">India</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Type</label>
                                <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-r-[8px] border-transparent outline outline-1 outline-slate-200 dark:outline-slate-700 text-slate-700 dark:text-white font-medium focus:outline-blue-500 text-sm">
                                  <option value="Service Agreement">Service Agreement</option>
                                  <option value="NDA">NDA</option>
                                  <option value="Employment">Employment</option>
                                  <option value="SaaS">SaaS</option>
                                  <option value="Other">Other</option>
                                </select>
                            </div>
                         </div>
                         
                         <button onClick={handleAnalyze} className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center">
                            <Zap className="h-5 w-5 mr-2" />
                            Deep Scan for Risks
                         </button>
                         <button onClick={clearFile} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium">Remove File</button>
                      </div>
                   </div>
                ) : (
                   // 3. ANALYSIS COMPLETE STATE
                   <div className="animate-reveal py-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200 dark:border-slate-800 p-8 text-center relative overflow-hidden">
                         {/* Success Tick */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-full border-4 border-white dark:border-slate-900">
                             <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                         </div>

                         <div className="mt-6 mb-8">
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{uploadedFile.name}</p>
                             <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                Analysis Complete <CheckCircle2 className="h-3 w-3" />
                             </p>
                         </div>

                         {/* Risk Anchor Message (From Full Analysis) */}
                         <div className="mb-10 max-w-2xl mx-auto relative">
                             <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                                "{analysisResult.confidence === 'Low' ? 'This contract contains unusual risk patterns that deserve careful review.' : analysisResult.riskAnchor}"
                             </h2>
                             {/* Quote decoration */}
                             <div className="absolute -top-6 -left-4 text-6xl text-slate-200 dark:text-slate-800 font-serif opacity-50">“</div>
                         </div>

                         <button 
                            onClick={handleViewFullReport} 
                            className="w-full max-w-md mx-auto py-5 rounded-2xl gradient-bg text-white font-bold text-lg shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all flex items-center justify-center group"
                         >
                            View Full Business Risk Report
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                         </button>
                      </div>
                   </div>
                )}
              </>
            )}

            {/* TAB CONTENT: PASTE */}
            {activeTab === 'paste' && (
              <>
                 <div className="relative">
                    <textarea value={contractText} onChange={(e) => setContractText(e.target.value)} placeholder="Paste your contract text here..." className="w-full h-80 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm text-slate-700 dark:text-slate-300 leading-relaxed" />
                    {contractText && <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">{contractText.length} chars</div>}
                 </div>

                 {metadata && (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5" /></div>
                            <div>
                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Extraction Successful</p>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">{metadata.pagesDetected} pages • {metadata.sectionsDetected} sections detected</p>
                            </div>
                        </div>
                        <button onClick={clearFile} className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors text-emerald-600 dark:text-emerald-400"><X className="h-4 w-4" /></button>
                    </div>
                 )}

                 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Jurisdiction</label>
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-r-[16px] border-transparent outline outline-1 outline-slate-200 dark:outline-slate-700 text-slate-700 dark:text-white font-medium focus:outline-blue-500">
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="European Union">European Union</option>
                            <option value="India">India</option>
                            <option value="Australia">Australia</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Contract Type</label>
                        <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-r-[16px] border-transparent outline outline-1 outline-slate-200 dark:outline-slate-700 text-slate-700 dark:text-white font-medium focus:outline-blue-500">
                            <option value="Service Agreement">Service Agreement</option>
                            <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                            <option value="Employment Contract">Employment Contract</option>
                            <option value="SaaS Agreement">SaaS Agreement</option>
                            <option value="Lease Agreement">Lease Agreement</option>
                            <option value="Partnership Agreement">Partnership Agreement</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                 </div>

                 <button onClick={handleAnalyze} disabled={!contractText.trim() || isAnalyzing} className="w-full mt-10 py-5 rounded-2xl gradient-bg text-white font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    {isAnalyzing ? "Processing..." : <><Scale className="h-6 w-6 mr-3" /> Analyze Risks</>}
                 </button>
              </>
            )}

            <div className="mt-6 text-center">
               <div className="flex items-center justify-center text-xs text-slate-400 font-medium"><Lock className="h-3 w-3 mr-1.5" /><span>Your data is processed in-memory and discarded after analysis.</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};