
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
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
}

export interface ClauseBreakdown {
  title?: string; // Section Header/Title
  originalText: string;
  explanation: string; // Plain English
  riskLevel: RiskLevel;
  riskReason: string;
}

export interface ContractSummary {
  executiveSummary: string; // What this contract is about, paying whom, etc.
  obligations: string[]; // Bullet points: What user MUST do
  rights: string[]; // Bullet points: What user receives
  commercials: string; // Money, penalties, lock-ins
  exit: string; // Termination, notice periods
  risk: string; // Liability, uncapped risks
  powerBalance: string; // Who has control
  top3Takeaways: string[]; // 3 most important things
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

export interface AnalysisResult {
  score: number; // 0-100
  verdict: 'Market-Standard' | 'Negotiable' | 'One-Sided' | 'High Risk'; 
  confidence: 'High' | 'Medium' | 'Low';
  confidenceReason: string;
  riskAnchor?: string; // Psychological hook
  contractSummary?: ContractSummary; // New Business Summary (Replaces clauses)
  analyzedRole: string; // The perspective automatically identified by AI
  marketComparison: string; // Text explaining how this compares to norms
  executiveSummary: string; // "Why this verdict"
  signedAsIsOutcome: string; // "If Signed As-Is" Consequence Summary
  factors: FactorEvaluation[]; // The 11 factors (A-K)
  topRisks: RiskItem[]; // "Red Flags"
  negotiationMoves: string[]; // Specific edits/asks
  missingClauses: string[]; // What should be there but isn't
  clauses?: ClauseBreakdown[]; // Deprecated, kept for type compatibility with old records
  coverage: DocumentCoverage;
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