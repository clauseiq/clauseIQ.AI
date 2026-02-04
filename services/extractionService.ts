import { performOCR } from './geminiService';
import { ExtractionResult, ExtractionMetadata } from '../types';

// NOTE: pdfjs-dist and mammoth are now imported dynamically to prevent
// top-level await or initialization errors from breaking the entire application bundle.

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 300000;

// CONFIGURATION: Remote Worker Path via CDN
// This ensures the worker is available without needing a local build step for the worker file.
const PDF_WORKER_URL = '/pdf.worker.mjs';

const PDF_CMAP_URL = 'https://esm.sh/pdfjs-dist@4.0.189/cmaps/';
const PDF_STANDARD_FONT_DATA_URL = 'https://esm.sh/pdfjs-dist@4.0.189/standard_fonts/';

// Cache the module promise so we don't re-import on every file
let pdfjsModulePromise: Promise<any> | null = null;

export const extractTextFromFile = async (file: File): Promise<ExtractionResult> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 10MB limit. Please upload a smaller file.");
  }

  let extractedText = '';
  let pagesDetected = 1;

  try {
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Robust file type detection
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

    if (!extractedText) {
      throw new Error("Could not extract any text from this file. It might be scanned or empty.");
    }

    if (extractedText.length > MAX_TEXT_LENGTH) {
      throw new Error(`Document is too long (${extractedText.length} chars). Limit is ${MAX_TEXT_LENGTH}. Please shorten.`);
    }

    const sectionsDetected = countSections(extractedText);

    const previewStart = extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : '');
    const previewEnd = extractedText.length > 1000 ? '...' + extractedText.substring(extractedText.length - 1000) : extractedText;

    const metadata: ExtractionMetadata = {
      pagesDetected,
      charactersExtracted: extractedText.length,
      sectionsDetected,
      previewStart,
      previewEnd
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

// --- EXTRACTION HELPERS (Main Thread) ---

const extractPdfText = async (file: File): Promise<{ text: string, pages: number }> => {
  try {
    // Optimized lazy loading: reuse the module if already loaded
    if (!pdfjsModulePromise) {
      pdfjsModulePromise = import('pdfjs-dist');
    }
    const pdfjsModule = await pdfjsModulePromise;
    const pdfjsLib = pdfjsModule.default || pdfjsModule;

    // Configure worker ONLY if not already set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    }

    const arrayBuffer = await file.arrayBuffer();

    // Ensure getDocument exists
    if (!pdfjsLib.getDocument) {
      throw new Error("PDF Library failed to load correctly.");
    }

    // Pass cMap parameters and disable some features for mobile performance
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: PDF_CMAP_URL,
      cMapPacked: true,
      standardFontDataUrl: PDF_STANDARD_FONT_DATA_URL,
      disableRange: true,
      disableStream: true
    });

    const pdf = await loadingTask.promise;

    // Cap pages strictly to 30 for performance on mobile devices
    const maxPages = 30;
    const pagesToProcess = Math.min(pdf.numPages, maxPages);
    const chunkedResults: string[] = new Array(pagesToProcess + 1).fill('');

    // PARALLEL BATCH PROCESSING
    const BATCH_SIZE = 3;

    for (let i = 1; i <= pagesToProcess; i += BATCH_SIZE) {
      const batchPromises = [];
      for (let j = i; j < i + BATCH_SIZE && j <= pagesToProcess; j++) {
        batchPromises.push(pdf.getPage(j).then(async (page: any) => {
          try {
            const textContent = await page.getTextContent();
            const text = textContent.items.map((item: any) => item.str).join(' ');
            // Essential: Clean up page resources immediately
            page.cleanup();
            return { pageNum: j, text };
          } catch (e) {
            console.warn(`Error parsing page ${j}`, e);
            return { pageNum: j, text: "[Error parsing page]" };
          }
        }));
      }

      const results = await Promise.all(batchPromises);
      results.forEach(r => {
        chunkedResults[r.pageNum] = r.text;
      });

      // Small yield to UI thread to prevent freezing
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    let fullText = chunkedResults.map((t, i) => i === 0 ? '' : `\n--- PAGE ${i} ---\n\n${t}\n\n`).join('');

    if (pdf.numPages > pagesToProcess) {
      fullText += `\n...[Truncated: Document exceeded ${maxPages} pages. First ${maxPages} pages processed.]...`;
    }

    // Clean up document resources
    loadingTask.destroy();

    return { text: fullText, pages: pdf.numPages };
  } catch (err: any) {
    console.error("PDF Parsing Error:", err);

    let message = "Failed to parse PDF.";
    if (err.message && err.message.includes("Cannot read properties of undefined")) {
      message = "PDF Parsing Error: Library version mismatch. Please reload the page.";
    } else if (err.name === 'PasswordException') {
      message = "PDF is password protected.";
    } else if (err.message && err.message.includes("worker")) {
      message = "PDF Worker Error: Could not load PDF processor. Check your connection.";
    } else if (err.message && err.message.includes("Setting up fake worker")) {
      message = "PDF Worker missing. Please ensure pdf.worker.min.mjs is in public folder.";
    }

    throw new Error(message);
  }
};

const extractDocxText = async (file: File): Promise<string> => {
  try {
    // Dynamic import
    const mammoth = await import('mammoth');
    const mammothLib = mammoth.default || mammoth;

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammothLib.extractRawText({ arrayBuffer });
    return result.value;
  } catch (err) {
    console.error("DOCX Parsing Error:", err);
    throw new Error("Failed to parse Word document.");
  }
};

const extractImageText = async (file: File): Promise<string> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
  });

  return await performOCR(base64, file.type);
};