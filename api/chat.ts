import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const siteUrl = process.env.VITE_SITE_URL || '*';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', siteUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { contractText, history, question } = req.body;
  if (!contractText || !question) return res.status(400).json({ error: 'Required fields missing' });

  // STRICT AUTH
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'model') {
           contents.push({ role: msg.role, parts: [{ text: msg.text }] });
        }
      });
    }
    contents.push({ role: 'user', parts: [{ text: question }] });

    const systemInstruction = `You are Clause IQ. Answer strictly based on the Contract Text provided.
    CONTRACT TEXT: """${contractText.substring(0, 100000)}"""`;

    // Simple Retry for Chat
    let retries = 3;
    let response;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contents,
          config: { systemInstruction },
        });
        break;
      } catch (err: any) {
        if (err.status === 503 || err.status === 429) {
          retries--;
          if (retries === 0) throw err;
          await new Promise(r => setTimeout(r, 1000));
        } else {
          throw err;
        }
      }
    }

    if (!response) throw new Error("Failed to get response");

    return res.status(200).json({ answer: response.text });
  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ error: "Failed to generate answer." });
  }
}