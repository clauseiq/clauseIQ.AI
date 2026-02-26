import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const siteUrl = process.env.VITE_SITE_URL || '*'; 

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PLANS = {
  FREE: { limit: 3 },
  PRO: { limit: Infinity },
  BUSINESS: { limit: Infinity }
};

const generateSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    verdict: { type: Type.STRING, enum: ["Market-Standard", "Negotiable", "One-Sided", "High Risk", "INVALID_DOCUMENT"] },
    confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
    confidenceReason: { type: Type.STRING },
    
    categoryScores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          score: { type: Type.INTEGER },
          weight: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
          relevantClauses: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["category", "score", "weight", "reasoning", "relevantClauses"]
      }
    },

    professionalSummary: {
      type: Type.OBJECT,
      properties: {
        overview: {
          type: Type.OBJECT,
          properties: {
            natureOfAgreement: { type: Type.STRING },
            partiesInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
            duration: { type: Type.STRING },
            corePurpose: { type: Type.STRING }
          },
          required: ["natureOfAgreement", "partiesInvolved", "duration", "corePurpose"]
        },
        commercialTerms: {
          type: Type.OBJECT,
          properties: {
            paymentTerms: { type: Type.STRING },
            deliverables: { type: Type.STRING },
            serviceScope: { type: Type.STRING }
          },
          required: ["paymentTerms", "deliverables", "serviceScope"]
        },
        riskHighlights: {
          type: Type.OBJECT,
          properties: {
            majorRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            financialExposure: { type: Type.STRING },
            legalExposure: { type: Type.STRING }
          },
          required: ["majorRisks", "financialExposure", "legalExposure"]
        },
        missingProtections: { type: Type.ARRAY, items: { type: Type.STRING } },
        overallAssessment: { type: Type.STRING },
        recommendation: { type: Type.STRING, enum: ["Accept as is", "Negotiate specific clauses", "Reject", "Escalate to legal counsel"] }
      },
      required: ["overview", "commercialTerms", "riskHighlights", "missingProtections", "overallAssessment", "recommendation"]
    },

    decision: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["Safe to Sign", "Sign with Changes", "High Risk – Negotiate", "Do Not Sign"] },
        color: { type: Type.STRING, enum: ["Green", "Yellow", "Orange", "Red"] },
        confidenceScore: { type: Type.INTEGER },
        reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
        financialRiskEstimate: { type: Type.STRING }
      },
      required: ["status", "color", "confidenceScore", "reasoning"]
    },

    topRisks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          technicalTerm: { type: Type.STRING },
          riskType: { type: Type.STRING },
          worstCase: { type: Type.STRING },
          impact: { type: Type.STRING },
          deviation: { type: Type.STRING },
          action: { type: Type.STRING },
          reference: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] }
        },
        required: ["title", "technicalTerm", "riskType", "worstCase", "impact", "deviation", "action", "reference", "severity"],
      },
    },
    
    coverage: {
      type: Type.OBJECT,
      properties: {
        sectionsCovered: { type: Type.INTEGER },
        skippedSections: { type: Type.ARRAY, items: { type: Type.STRING } },
        isComplete: { type: Type.BOOLEAN }
      },
      required: ["sectionsCovered", "skippedSections", "isComplete"]
    }
  },
  required: ["score", "verdict", "confidence", "confidenceReason", "categoryScores", "professionalSummary", "decision", "topRisks", "coverage"],
};

const anchorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    riskAnchor: { type: Type.STRING },
    verdict: { type: Type.STRING, enum: ["Standard", "Negotiable", "Risky", "Dangerous"] }
  },
  required: ["riskAnchor", "verdict"]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', siteUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, country, contractType, task } = req.body; 
  if (!text) return res.status(400).json({ error: 'Contract text is required' });

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, plan: 'Free', analyses_used: 0 })
      .select().single();
    profile = newProfile || { plan: 'Free', analyses_used: 0 };
  }

  const planKey = (profile.plan || 'Free').toUpperCase() as keyof typeof PLANS;
  const PRIVILEGED_EMAILS = ['clauseiq.dev2026@gmail.com']; 
  const isPrivileged = user.email && PRIVILEGED_EMAILS.includes(user.email);
  const limit = isPrivileged ? Infinity : (PLANS[planKey]?.limit || 3);
  const used = profile.analyses_used || 0;

  if (used >= limit) {
    return res.status(402).json({ error: 'Plan limit reached. Upgrade to Pro for unlimited scans.' });
  }

  try {
    if (task === 'anchor') {
       const anchorPrompt = `
          You are Clause IQ. Read the contract excerpt below.
          Context: Jurisdiction: ${country}, Type: ${contractType}
          Generate a "Psychological Anchor":
          1. Scan for the single most aggressive or dangerous financial/liability term.
          2. Summarize it in ONE short sentence (max 15 words).
          3. Create urgency.
          Text: "${text.substring(0, 100000)}"
       `;

       let retries = 3;
       let response;
       while (retries > 0) {
         try {
           response = await ai.models.generateContent({
             model: 'gemini-flash-latest',
             contents: anchorPrompt,
             config: {
               responseMimeType: "application/json",
               responseSchema: anchorSchema,
               temperature: 0, 
               seed: generateSeed(text + country + contractType + "anchor"), 
             },
           });
           break;
         } catch (error: any) {
           const errMsg = error.message?.toLowerCase() || '';
           if (error.status === 429 && (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('exhausted'))) {
              throw new Error("QUOTA_EXCEEDED");
           }
           if ((error.status === 503 || error.status === 429) && retries > 1) {
             retries--;
             const delay = Math.pow(2, (3 - retries)) * 1000 + Math.random() * 500;
             await new Promise(resolve => setTimeout(resolve, delay));
           } else {
             throw error;
           }
         }
       }
       
       if (!response) throw new Error("Failed to get anchor response.");
       return res.status(200).json(JSON.parse(response.text!));
    }

    const systemInstruction = `
      Your objective is to analyze contracts efficiently while maintaining high-quality legal reasoning.
      CORE PRINCIPLES:
      * Faster performance comes from workflow optimization.
      * Prefer concise bullet points and structured responses.
      * Focus only on major risks, strengths, and legally meaningful insights.
      * Default maximum output length: ~200 words for summaries unless explicitly asked for more.
      
      OUTPUT EFFICIENCY RULES:
      * Avoid long explanations.
      * Present high-level conclusions first.
      * Ignore formatting artifacts (OCR noise, headers).
    `;

    // Helper for chunking large texts
    const chunkText = (text: string, chunkSize: number = 25000): string[] => {
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
      }
      return chunks;
    };

    // Fast Stage A: Analyze a chunk
    const analyzeChunk = async (chunkText: string): Promise<string> => {
      const chunkPrompt = `
        Stage A - Fast Structural Analysis:
        1. Detect key clauses.
        2. Label high-risk areas (Liability, Indemnity, Termination, IP).
        3. Extract key commercial terms.
        Output a concise summary (max 100 words) of findings. Bullet points only.
        Text: "${chunkText.substring(0, 30000)}"
      `;
      const result = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: chunkPrompt,
        config: {
          systemInstruction: "You are a fast contract analyzer. Be extremely concise.",
          temperature: 0,
        }
      });
      return result.text || "";
    };

    let contextForAnalysis = text;

    // PIPELINE LOGIC: If text is large (> 25k chars), use Map-Reduce to speed up processing
    if (text.length > 25000) {
       const chunks = chunkText(text);
       // Parallel execution
       const summaries = await Promise.all(chunks.map(chunk => analyzeChunk(chunk)));
       contextForAnalysis = "MERGED SUMMARIES OF CONTRACT SECTIONS:\n" + summaries.join("\n\n");
    }

    const prompt = `
      You are Clause IQ.
      Context: Jurisdiction: ${country}, Type: ${contractType}
      Task: Analyze the provided contract content and generate a structured risk assessment.
      
      *** CRITICAL VALIDATION STEP ***
      First, check if the input looks like a legal contract. If not, SET verdict to INVALID_DOCUMENT.
      
      GOAL: Generate a coherent, business-focused contract summary in plain English.
      SPEED OPTIMIZATION: Keep all text fields extremely concise (max 1-2 sentences per field).
      
      1. SCORING SYSTEM (0-100):
         Calculate the "score" based on weighted categories.
         Populate "categoryScores". Reasoning must be 1 sentence max.

      2. PROFESSIONAL SUMMARY:
         Populate "professionalSummary". 
         - Overview: Max 2 sentences.
         - Risks: Bullet points, max 10 words each.
         - Recommendation: 1 sentence.

      3. DECISION ENGINE:
         Populate "decision". Reasoning: 3 bullet points max, 1 sentence each.

      4. Identify up to 5 Critical Issues ("topRisks").
      
      Input Content: "${contextForAnalysis.substring(0, 150000)}" 
    `;

    const generateWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await ai.models.generateContentStream({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: analysisSchema,
              temperature: 0, 
              systemInstruction: systemInstruction,
              seed: generateSeed(text + country + contractType + "full"),
            },
          });
        } catch (error: any) {
           const errMsg = error.message?.toLowerCase() || '';
           if (error.status === 429 && (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('exhausted'))) {
              throw new Error("QUOTA_EXCEEDED");
           }
           if ((error.status === 503 || error.status === 429) && i < retries - 1) {
             const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
             await new Promise(resolve => setTimeout(resolve, delay));
             continue;
           }
           throw error;
        }
      }
      throw new Error("Model overloaded.");
    };

    const streamResult = await generateWithRetry();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of streamResult) {
      if (chunk.text) res.write(chunk.text);
    }
    res.end();

  } catch (error) {
    console.error("Analysis Error:", error);
    if (!res.headersSent) {
       if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
          return res.status(402).json({ error: "API quota exceeded. Please upgrade your plan or check your billing." });
       }
       return res.status(503).json({ error: "System is experiencing high traffic. Please try again in a moment." });
    }
    res.end();
  }
}