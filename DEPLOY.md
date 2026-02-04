# Deployment Guide for Clause IQ

This guide explains how to deploy your application to Vercel for free.

## 1. Prerequisites

- A GitHub account (to host your code).
- A Vercel account (free at [vercel.com](https://vercel.com)).

## 2. Environment Variables

You must configure these in your Vercel Project Settings -> Environment Variables.

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API Key. |
| `VITE_SUPABASE_URL` | Your Supabase Project URL. |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key. |
| `VITE_SITE_URL` | Set to `https://your-project-name.vercel.app` after deployment. |
| `MOCK_AI_RESPONSE` | **IMPORTANT**: Set to `true` if you have no API quota or want to demo for free. |

## 3. Deploying

1.  Push your code to a GitHub repository.
2.  Login to Vercel and click "Add New... > Project".
3.  Import your GitHub repository.
4.  Vercel will auto-detect "Vite".
5.  **Expand "Environment Variables"** and add the variables listed above.
6.  Click **Deploy**.

## 4. Addressing "Free Tier Exhausted"

If you have exhausted your Google Gemini API free tier, you have two options:

### Option A: Use Mock Mode (Recommended for Demos)
Set `MOCK_AI_RESPONSE=true` in your Vercel Environment Variables.
- **Pros**: Free, fast, reliable, works forever.
- **Cons**: Always returns the same sample analysis (Contractor Agreement).

### Option B: Create a New API Key
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Click "Get API Key".
3.  Create a key in a **new Google Cloud Project** (this usually resets the quota/billing account link).
4.  Update the `GEMINI_API_KEY` in Vercel.

## 5. Verification

After deployment:
1.  Visit your Vercel URL.
2.  Log in (Supabase Auth should work if keys are set).
3.  Upload a document.
4.  If using Mock Mode, you should see the result instantly.
