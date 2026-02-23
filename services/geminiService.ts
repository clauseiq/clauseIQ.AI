import { AnalysisResult } from "../types";
import { supabase } from "../supabaseClient";

const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  if (!token) {
      throw new Error("Authentication required. Please log in.");
  }
  
  return { 'Authorization': `Bearer ${token}` };
};

export const getQuickAnchor = async (
  text: string,
  country: string,
  contractType: string
): Promise<{ riskAnchor: string; verdict: string }> => {
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({
        text,
        country,
        contractType,
        task: 'anchor'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 402) {
         throw new Error("QUOTA_LIMIT_REACHED");
      }
      throw new Error(errorData.error || "Failed to get immediate impression.");
    }
    return await response.json();

  } catch (error) {
    console.error("Anchor Error:", error);
    throw error;
  }
};

export const analyzeContract = async (
  text: string, 
  country: string, 
  contractType: string
): Promise<AnalysisResult> => {
  
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({
        text,
        country,
        contractType
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Check for monetization blockers (402)
      if (response.status === 402) {
         throw new Error("PLAN_LIMIT_REACHED"); // Internal plan limit
      }
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    // Handle Streaming Response
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to read response stream");

    const decoder = new TextDecoder();
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulatedText += decoder.decode(value, { stream: true });
    }

    // Parse the full accumulated JSON
    try {
       const cleanedText = accumulatedText.replace(/```json\n?|\n?```/g, "").trim();
       const data = JSON.parse(cleanedText) as AnalysisResult;
       return data;
    } catch (parseError) {
       console.error("JSON Parse Error:", parseError);
       console.log("Raw Text:", accumulatedText);
       throw new Error("Failed to parse AI response. Please try again.");
    }

  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const performOCR = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({
        base64: base64Image,
        mimeType
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 402) {
         throw new Error("QUOTA_LIMIT_REACHED");
      }
      throw new Error(errorData.error || `OCR Server Error: ${response.status}`);
    }

    const data = await response.json();
    return data.text;

  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from image.");
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const askContractQuestion = async (
  contractText: string,
  history: ChatMessage[],
  question: string
): Promise<string> => {
  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({
        contractText,
        history,
        question
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 402) {
         throw new Error("QUOTA_LIMIT_REACHED");
      }
      throw new Error(errorData.error || "Failed to get answer");
    }

    const data = await response.json();
    return data.answer;

  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};