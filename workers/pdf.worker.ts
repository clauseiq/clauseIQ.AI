import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.189/build/pdf.worker.mjs';

self.onmessage = async (e: MessageEvent) => {
  const { arrayBuffer, maxPages } = e.data;

  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const pagesToProcess = Math.min(pdf.numPages, maxPages || 50);

    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n--- PAGE ${i} ---\n\n` + pageText + '\n\n';
    }

    if (pdf.numPages > pagesToProcess) {
      // We don't throw, just warn via metadata text
      fullText += `\n...[Truncated: Document exceeded ${pagesToProcess} pages]...`;
    }

    self.postMessage({ 
      status: 'complete', 
      text: fullText, 
      pages: pdf.numPages 
    });

  } catch (error) {
    self.postMessage({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown PDF parsing error' 
    });
  }
};