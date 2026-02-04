import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock GoogleGenAI BEFORE importing the handler
vi.mock('@google/genai', () => ({
    GoogleGenAI: class {
        models = {
            generateContent: vi.fn(),
            generateContentStream: vi.fn()
        };
        constructor(config: any) { }
    },
    Type: { OBJECT: 'OBJECT', STRING: 'STRING', INTEGER: 'INTEGER', ARRAY: 'ARRAY', BOOLEAN: 'BOOLEAN' },
    Schema: {}
}));

import apiHandler from '../api/analyze';

// Mock Vercel Request/Response
const createMockReqRes = (body: any, method = 'POST') => {
    const req = {
        method,
        body,
        headers: { authorization: 'Bearer test-token' },
    } as any;

    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        setHeader: vi.fn(),
        end: vi.fn(),
        write: vi.fn(),
    } as any;

    return { req, res };
};

describe('API Handler', () => {
    it('should return 405 for non-POST requests', async () => {
        const { req, res } = createMockReqRes({}, 'GET');
        await apiHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should return 400 if text is missing', async () => {
        // Note: We need to bypass the MOCK_MODE check for this test or ensure it handles validation first.
        // In our implementation, Mock Mode check is BEFORE validation? Let's check code.
        // Actually, Mock Mode is inside the function.
        // Let's set MOCK_AI_RESPONSE to false to test validation
        process.env.MOCK_AI_RESPONSE = 'false';

        const { req, res } = createMockReqRes({ country: 'US' });
        await apiHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return mock data when MOCK_AI_RESPONSE is true', async () => {
        process.env.MOCK_AI_RESPONSE = 'true';
        const { req, res } = createMockReqRes({ text: 'Test contract', task: 'analyze' });

        await apiHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            verdict: 'Market-Standard'
        }));
    });
});
