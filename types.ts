
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface RiskItem {
  title: string;
  technicalTerm?: string;
  riskType: string;
  worstCase: string;
  impact: string;
  deviation?: string;
  action: string;
  reference: string;
}

export interface ClauseBreakdown {
  title?: string;
  originalText: string;
  explanation: string;
  riskLevel: RiskLevel;
  riskReason: string;
}

export interface ContractSummary {
  executiveSummary: string;
  obligations: string[];
  rights: string[];
  commercials: string;
  exit: string;
  risk: string;
  powerBalance: string;
  top3Takeaways: string[];
}

export interface DocumentCoverage {
  sectionsCovered: number;
  skippedSections: string[];
  isComplete: boolean;
}

export interface FactorEvaluation {
  factor: string;
  status: 'Healthy' | 'Neutral' | 'Risky';
  detail: string;
}

/**
 * Auto-detected structural issues that go beyond individual clause risks.
 * All fields are boolean — true = issue present.
 */
export interface AutoDetectedIssues {
  missingTerminationClause: boolean;
  missingIndemnityProtection: boolean;
  oneSidedLiability: boolean;
  unclearJurisdiction: boolean;
  autoRenewalTrap: boolean;
  expiredDates: boolean;
  conflictingClauses: boolean;
  duplicateClauses: boolean;
}

export interface AnalysisResult {
  score: number; // 0-100; validated server-side
  verdict: 'Market-Standard' | 'Negotiable' | 'One-Sided' | 'High Risk' | 'INVALID_DOCUMENT';
  confidence: 'High' | 'Medium' | 'Low';
  confidenceReason: string;
  riskAnchor?: string;
  contractSummary?: ContractSummary;
  analyzedRole: string;
  marketComparison: string;
  executiveSummary: string;
  signedAsIsOutcome: string;
  factors: FactorEvaluation[];
  topRisks: RiskItem[];
  negotiationMoves: string[];
  missingClauses: string[];
  clauses?: ClauseBreakdown[]; // Deprecated — kept for backward compat with saved records
  coverage: DocumentCoverage;
  /** Structural issues auto-detected by AI beyond individual clause risks */
  autoDetectedIssues?: AutoDetectedIssues;
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
} as const;