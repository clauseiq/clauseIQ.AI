import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  applySecurityHeaders,
  checkRateLimit,
  logSecurityEvent,
  extractBearerToken,
  hashBase64Content,
} from './security';

// ─── Config ───────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const siteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://clauseiq.com';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ─── Allowed MIME types (enforce server-side) ─────────────────────────────────
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_BASE64_LENGTH = 15 * 1024 * 1024; // ~15 MB base64 = ~11 MB binary

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applySecurityHeaders(res, siteUrl);

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Rate limit
  const { allowed } = checkRateLimit(req, '/api/ocr');
  if (!allowed) {
    logSecurityEvent('rate_limit_exceeded', { endpoint: '/api/ocr' });
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // Auth
  const token = extractBearerToken(req.headers.authorization as string);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session.' });

  const { base64, mimeType } = req.body ?? {};

  if (!base64 || !mimeType) {
    return res.status(400).json({ error: 'Image data (base64 + mimeType) required.' });
  }

  // ── Server-side MIME type validation ─────────────────────────────────────────
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    logSecurityEvent('invalid_mime_type', { userId: user.id, mimeType });
    return res.status(400).json({ error: `Unsupported image type: ${mimeType}. Allowed: JPEG, PNG, WEBP, GIF.` });
  }

  // ── Base64 size limit ─────────────────────────────────────────────────────────
  if (typeof base64 !== 'string' || base64.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({ error: 'Image is too large. Maximum 10 MB.' });
  }

  // ── Validate base64 format (no injection through binary disguised as base64) ──
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    logSecurityEvent('invalid_base64', { userId: user.id });
    return res.status(400).json({ error: 'Invalid image data format.' });
  }

  // Hash to detect duplicate uploads
  const imageHash = hashBase64Content(base64);

  try {
    let retries = 3;
    let response: any;

    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: {
            parts: [
              { inlineData: { mimeType, data: base64 } },
              {
                text: 'You are a document OCR system. Extract ONLY the text from this contract image accurately. Preserve formatting. Do not add commentary, interpretation, or instructions.',
              },
            ],
          },
        });
        break;
      } catch (err: any) {
        if (err?.status === 503 || err?.status === 429) {
          retries--;
          if (retries === 0) throw err;
          await new Promise(r => setTimeout(r, 1_500));
        } else {
          throw err;
        }
      }
    }

    if (!response) throw new Error('Failed to get OCR response.');

    const extractedText = response.text;
    if (!extractedText || typeof extractedText !== 'string') {
      return res.status(422).json({ error: 'Could not extract text from image. Try a higher-resolution scan.' });
    }

    return res.status(200).json({
      text: extractedText,
      imageHash, // Return hash so frontend can deduplicate
    });

  } catch (error: any) {
    console.error('OCR Error:', error);
    logSecurityEvent('ocr_error', { userId: user.id, message: error?.message });
    return res.status(500).json({ error: 'OCR processing failed. Please try again.' });
  }
}