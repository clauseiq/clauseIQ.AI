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
    riskAnchor: { type: Type.STRING, description: "A SINGLE short sentence (max 20 words) highlighting the MOST IMPORTANT BUSINESS RISK. Create urgency. No legal jargon." },
    analyzedRole: { type: Type.STRING },
    marketComparison: { type: Type.STRING },
    executiveSummary: { type: Type.STRING },
    signedAsIsOutcome: { type: Type.STRING, description: "A realistic scenario-based summary of consequences if signed as-is." },
    contractSummary: {
      type: Type.OBJECT,
      properties: {
        executiveSummary: { type: Type.STRING },
        obligations: { type: Type.ARRAY, items: { type: Type.STRING } },
        rights: { type: Type.ARRAY, items: { type: Type.STRING } },
        commercials: { type: Type.STRING },
        exit: { type: Type.STRING },
        risk: { type: Type.STRING },
        powerBalance: { type: Type.STRING },
        top3Takeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["executiveSummary", "obligations", "rights", "commercials", "exit", "risk", "powerBalance", "top3Takeaways"]
    },
    factors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["Healthy", "Neutral", "Risky"] },
          detail: { type: Type.STRING }
        },
        required: ["factor", "status", "detail"]
      }
    },
    missingClauses: { type: Type.ARRAY, items: { type: Type.STRING } },
    negotiationMoves: { type: Type.ARRAY, items: { type: Type.STRING } },
    coverage: {
      type: Type.OBJECT,
      properties: {
        sectionsCovered: { type: Type.INTEGER },
        skippedSections: { type: Type.ARRAY, items: { type: Type.STRING } },
        isComplete: { type: Type.BOOLEAN }
      },
      required: ["sectionsCovered", "skippedSections", "isComplete"]
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
          reference: { type: Type.STRING }
        },
        required: ["title", "technicalTerm", "riskType", "worstCase", "impact", "deviation", "action", "reference"],
      },
    },
  },
  required: ["score", "verdict", "confidence", "confidenceReason", "riskAnchor", "analyzedRole", "marketComparison", "executiveSummary", "signedAsIsOutcome", "contractSummary", "factors", "missingClauses", "negotiationMoves", "topRisks", "coverage"],
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

    await supabase.rpc('increment_analyses', { user_id: user.id });

    const prompt = `
      You are Clause IQ, the "Contract Intelligence Summarizer".
      Context: Jurisdiction: ${country}, Type: ${contractType}
      Task: Analyze the text provided.
      
      *** CRITICAL VALIDATION STEP ***
      First, check if the input text looks like a legal contract. If not, SET verdict to INVALID_DOCUMENT.
      If it is a contract, proceed:
      GOAL: Generate a coherent, business-focused contract summary in plain English.
      1. Identify up to 5 Critical Issues.
      2. Provide a "If Signed As-Is" Consequence Summary.
      3. Generate a "Risk Anchor".
      4. GENERATE "Contract Summary" object with executiveSummary, obligations, rights, commercials, exit, risk, powerBalance, and top3Takeaways.
      Text: "${text.substring(0, 150000)}" 
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