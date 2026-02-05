import { performOCR } from './geminiService';
import { ExtractionResult, ExtractionMetadata } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 300000; 

// Using a consistent CDN for both lib and worker
const PDFJS_VERSION = '4.0.189';
const PDFJS_WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

let pdfjsModulePromise: Promise<any> | null = null;

export const extractTextFromFile = async (file: File): Promise<ExtractionResult> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 10MB limit. Please upload a smaller file.");
  }

  let extractedText = '';
  let pagesDetected = 1;

  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    const isPDF = file.type === 'application/pdf' || extension === 'pdf';
    const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx';
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(extension || '');

    if (isPDF) {
      const pdfResult = await extractPdfText(file);
      extractedText = pdfResult.text;
      pagesDetected = pdfResult.pages;
    } else if (isWord) {
      extractedText = await extractDocxText(file);
      pagesDetected = Math.max(1, Math.ceil(extractedText.length / 3000));
    } else if (isImage) {
      extractedText = await extractImageText(file);
      pagesDetected = 1;
    } else {
      throw new Error("Unsupported file type. Please upload PDF, DOCX, JPG, or PNG.");
    }

    extractedText = extractedText.trim();

    // IF NO TEXT WAS EXTRACTED FROM PDF, IT MIGHT BE SCANNED. TRY OCR.
    if (isPDF && (!extractedText || extractedText.replace(/--- PAGE \d+ ---/g, '').trim().length < 50)) {
        console.log("Empty PDF detected, falling back to Gemini OCR...");
        extractedText = await extractImageText(file);
    }

    if (!extractedText) {
      throw new Error("Could not extract any text from this file. The document might be empty or corrupted.");
    }

    if (extractedText.length > MAX_TEXT_LENGTH) {
      throw new Error(`Document is too long (${extractedText.length} chars). Limit is ${MAX_TEXT_LENGTH}. Please shorten.`);
    }

    const sectionsDetected = countSections(extractedText);
    
    const metadata: ExtractionMetadata = {
      pagesDetected,
      charactersExtracted: extractedText.length,
      sectionsDetected,
      previewStart: extractedText.substring(0, 500),
      previewEnd: extractedText.substring(extractedText.length - 500)
    };

    return {
      text: extractedText,
      metadata
    };

  } catch (error) {
    console.error("Extraction Failed:", error);
    throw error;
  }
};

const countSections = (text: string): number => {
  const sectionPattern = /^((ARTICLE|SECTION|PART)\s+\d+|[IVXLCDM]+\.|[0-9]+\.\d+)/gim;
  const matches = text.match(sectionPattern);
  return matches ? matches.length : 0;
};

const extractPdfText = async (file: File): Promise<{ text: string, pages: number }> => {
  try {
    if (!pdfjsModulePromise) {
      // Import the library from esm.sh to match importmap
      pdfjsModulePromise = import('https://esm.sh/pdfjs-dist@4.0.189');
    }
    const pdfjsLib = await pdfjsModulePromise;
    
    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      stopAtErrors: false 
    });

    const pdf = await loadingTask.promise;
    const maxPages = 40; 
    const pagesToProcess = Math.min(pdf.numPages, maxPages);
    let fullText = '';

    for (let i = 1; i <= pagesToProcess; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ');
        
        fullText += `\n--- PAGE ${i} ---\n\n${pageText}\n\n`;
        page.cleanup();
      } catch (pageErr) {
        console.warn(`Could not parse page ${i}`, pageErr);
        fullText += `\n--- PAGE ${i} (Extraction Failed) ---\n\n`;
      }
    }

    if (pdf.numPages > pagesToProcess) {
      fullText += `\n...[Truncated: Only first ${pagesToProcess} pages processed.]...`;
    }

    await loadingTask.destroy();

    return { text: fullText, pages: pdf.numPages };
  } catch (err: any) {
    console.error("PDF Parsing Error:", err);
    throw new Error(err.name === 'PasswordException' ? "PDF is password protected." : "Failed to parse PDF structure.");
  }
};

const extractDocxText = async (file: File): Promise<string> => {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await (mammoth.default || mammoth).extractRawText({ arrayBuffer });
    return result.value;
  } catch (err) {
    throw new Error("Failed to parse Word document.");
  }
};

const extractImageText = async (file: File): Promise<string> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
  return await performOCR(base64, file.type);
};