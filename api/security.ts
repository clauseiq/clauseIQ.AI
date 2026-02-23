/**
 * security.ts — Shared security utilities for all API routes
 *
 * Covers:
 * • Rate limiting (in-memory, per IP, per-endpoint)
 * • Input sanitisation / XSS prevention
 * • File-hash helpers (SHA-256)
 * • Idempotency key tracking
 * • Security response headers
 * • Request-size limits
 */

import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RateLimitEntry {
    count: number;
    firstRequest: number;
    blocked: boolean;
}

// ─── In-memory stores ─────────────────────────────────────────────────────────
// NOTE: On Vercel serverless these are per-cold-start; fine for burst protection.
// Replace with Redis for distributed rate limiting in high-traffic production.

const rateLimitStore: Map<string, RateLimitEntry> = new Map();
const idempotencyStore: Map<string, { status: number; body: any; ts: number }> = new Map();

// ─── Constants ────────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB body size limit

const RATE_LIMITS: Record<string, number> = {
    '/api/analyze': 5,
    '/api/ocr': 10,
    '/api/chat': 20,
    '/api/checkout': 3,
    '/api/verify': 3,
    default: 30,
};

// ─── Security Headers ─────────────────────────────────────────────────────────

export function applySecurityHeaders(res: VercelResponse, allowedOrigin: string): void {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'none'; object-src 'none';"
    );
    // Strict-Transport-Security is set by the CDN/Vercel, but belt-and-suspenders:
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

export function checkRateLimit(
    req: VercelRequest,
    endpoint: string
): { allowed: boolean; remaining: number } {
    const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown';
    const key = `${ip}:${endpoint}`;
    const limit = RATE_LIMITS[endpoint] ?? RATE_LIMITS['default'];
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
        entry = { count: 1, firstRequest: now, blocked: false };
        rateLimitStore.set(key, entry);
        return { allowed: true, remaining: limit - 1 };
    }

    entry.count++;

    if (entry.count > limit) {
        entry.blocked = true;
        rateLimitStore.set(key, entry);
        return { allowed: false, remaining: 0 };
    }

    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: limit - entry.count };
}

// ─── Idempotency ──────────────────────────────────────────────────────────────

/** Returns cached response if idempotency key was previously used, else null. */
export function checkIdempotency(
    key: string
): { status: number; body: any } | null {
    const IDEMPOTENCY_TTL_MS = 15 * 60_000; // 15 minutes
    const entry = idempotencyStore.get(key);
    if (entry && Date.now() - entry.ts < IDEMPOTENCY_TTL_MS) {
        return { status: entry.status, body: entry.body };
    }
    return null;
}

export function storeIdempotencyResult(
    key: string,
    status: number,
    body: any
): void {
    idempotencyStore.set(key, { status, body, ts: Date.now() });
    // Prune old entries periodically
    if (idempotencyStore.size > 10_000) {
        const cutoff = Date.now() - 15 * 60_000;
        for (const [k, v] of idempotencyStore) {
            if (v.ts < cutoff) idempotencyStore.delete(k);
        }
    }
}

// ─── Input Sanitization ───────────────────────────────────────────────────────

/** Strip HTML tags and control characters to prevent XSS/injection via text. */
export function sanitizeText(input: unknown, maxLength = 200_000): string {
    if (typeof input !== 'string') return '';
    return input
        .replace(/<[^>]*>/g, '') // strip HTML tags
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
        .substring(0, maxLength);
}

/** Validates a string matches allowed plan types to prevent injection. */
export function validatePlanType(value: unknown): 'pro_monthly' | 'topup_5' | null {
    if (value === 'pro_monthly' || value === 'topup_5') return value;
    return null;
}

/** Validate currency: only allow 'INR' or 'USD'. */
export function validateCurrency(value: unknown): 'INR' | 'USD' {
    if (value === 'INR') return 'INR';
    return 'USD';
}

// ─── File Integrity ───────────────────────────────────────────────────────────

/** Hash a base64 image string (SHA-256) to detect duplicates. */
export function hashBase64Content(base64: string): string {
    return crypto.createHash('sha256').update(base64).digest('hex');
}

/** Hash raw text content for deduplication. */
export function hashText(text: string): string {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// ─── JWT / Auth Helpers ───────────────────────────────────────────────────────

/** Extract Bearer token from Authorization header, rejecting malformed values. */
export function extractBearerToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const [scheme, token] = authHeader.trim().split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    // Basic JWT shape validation: 3 base64url parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return token;
}

// ─── Body Size Guard ──────────────────────────────────────────────────────────

/** Return false if the parsed body is too large (rough check on serialized length). */
export function isBodyTooLarge(body: unknown): boolean {
    try {
        return JSON.stringify(body).length > MAX_BODY_BYTES;
    } catch {
        return true;
    }
}

// ─── Prompt Injection Guard ───────────────────────────────────────────────────

const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instruction/i,
    /you\s+are\s+now\s+/i,
    /new\s+instruction/i,
    /system\s+prompt/i,
    /\bact\s+as\b/i,
    /jailbreak/i,
    /disregard\s+(your|the)\s+(rules|instructions)/i,
];

/** Returns true if text contains common prompt-injection patterns. */
export function detectPromptInjection(text: string): boolean {
    return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Logs security events without exposing sensitive data. */
export function logSecurityEvent(
    event: string,
    metadata: Record<string, unknown>
): void {
    const safeLog: Record<string, unknown> = {
        event,
        ts: new Date().toISOString(),
        ...metadata,
    };
    // Never log tokens, secrets, or full contract text
    delete safeLog['token'];
    delete safeLog['secret'];
    delete safeLog['text'];
    delete safeLog['base64'];
    console.warn('[SECURITY]', JSON.stringify(safeLog));
}
