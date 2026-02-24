
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface RiskItem {
  title: string;
  technicalTerm?: string; // Legal concept name (e.g., "Uncapped Indemnity")
  riskType: string; // e.g., Financial, Operational, Liability
  worstCase: string; // Worst-case outcome scenario
  impact: string; // Why it matters in business terms
  deviation?: string; // How it deviates from market standard
  action: string; // What to do
  reference: string; // Clause number, section title, or quote
  severity: RiskLevel;
}

export interface ClauseBreakdown {
  title?: string; // Section Header/Title
  originalText: string;
  explanation: string; // Plain English
  riskLevel: RiskLevel;
  riskReason: string;
}

export interface CategoryScore {
  category: string; // e.g., "Liability & Indemnity"
  score: number; // 0-100
  weight: number; // Percentage weight (e.g., 25)
  reasoning: string; // Why this score was given
  relevantClauses: string[]; // Excerpts
}

export interface ProfessionalSummary {
  overview: {
    natureOfAgreement: string;
    partiesInvolved: string[];
    duration: string;
    corePurpose: string;
  };
  commercialTerms: {
    paymentTerms: string;
    deliverables: string;
    serviceScope: string;
  };
  riskHighlights: {
    majorRisks: string[];
    financialExposure: string;
    legalExposure: string;
  };
  missingProtections: string[];
  overallAssessment: string;
  recommendation: 'Accept as is' | 'Negotiate specific clauses' | 'Reject' | 'Escalate to legal counsel';
}

export interface Decision {
  status: 'Safe to Sign' | 'Sign with Changes' | 'High Risk – Negotiate' | 'Do Not Sign';
  color: 'Green' | 'Yellow' | 'Orange' | 'Red';
  confidenceScore: number;
  reasoning: string[];
  financialRiskEstimate?: string;
}

export interface AnalysisResult {
  score: number; // 0-100 (Weighted Aggregate)
  verdict: 'Market-Standard' | 'Negotiable' | 'One-Sided' | 'High Risk'; 
  confidence: 'High' | 'Medium' | 'Low';
  confidenceReason: string;
  riskAnchor?: string; // Psychological hook
  
  // New Structured Data
  categoryScores: CategoryScore[];
  professionalSummary: ProfessionalSummary;
  decision: Decision;
  
  // Legacy/Helper fields
  analyzedRole: string; // The perspective automatically identified by AI
  marketComparison: string; // Text explaining how this compares to norms
  executiveSummary: string; // "Why this verdict" (Keep for backward compat or simple view)
  signedAsIsOutcome: string; // "If Signed As-Is" Consequence Summary
  factors: FactorEvaluation[]; // The 11 factors (A-K) - Keep for backward compat if needed, or map to categories
  topRisks: RiskItem[]; // "Red Flags"
  negotiationMoves: string[]; // Specific edits/asks
  missingClauses: string[]; // What should be there but isn't
  clauses?: ClauseBreakdown[]; // Deprecated, kept for type compatibility with old records
  coverage: DocumentCoverage;
}

export interface DocumentCoverage {
  sectionsCovered: number;
  skippedSections: string[];
  isComplete: boolean;
}

export interface FactorEvaluation {
  factor: string; // e.g. "Payment & Pricing Fairness"
  status: 'Healthy' | 'Neutral' | 'Risky';
  detail: string;
}

export interface ExtractionMetadata {
  pagesDetected: number;
  charactersExtracted: number;
  sectionsDetected: number;
  previewStart: string;
  previewEnd: string;
}

export interface ExtractionResult {
  text: string;
  metadata: ExtractionMetadata;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: 'Free' | 'Pro' | 'Business';
  analysesUsed: number;
}

export const PLANS = {
  FREE: { limit: 3, name: 'Free Trial' },
  PRO: { limit: Infinity, name: 'Pro Plan' },
  BUSINESS: { limit: Infinity, name: 'Business Plan' }
};