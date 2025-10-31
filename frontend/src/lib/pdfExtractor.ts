import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js - use local file to avoid CORS issues
// The worker file is copied to public folder during build
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

console.log(`PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);

/**
 * Extract text content from a PDF file
 * @param file - The PDF file to extract text from
 * @returns Promise with the extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log(`Extracting text from PDF: ${file.name} (${file.size} bytes)`);
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('PDF file is empty');
    }
    
    console.log('Loading PDF document...');
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
    
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .filter((str: string) => str.trim().length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
        }
        
        console.log(`Extracted page ${pageNum}/${pdf.numPages}`);
      } catch (pageError) {
        console.error(`Error extracting page ${pageNum}:`, pageError);
        fullText += `\n--- Page ${pageNum} ---\n[Could not extract text from this page]\n`;
      }
    }
    
    if (fullText.trim().length === 0) {
      throw new Error('No text content found in PDF. The file may be image-based (scanned) or empty.');
    }
    
    console.log(`✅ Successfully extracted ${fullText.length} characters from PDF`);
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    // Get detailed error info
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : '';
    
    console.error('PDF Error Details:', {
      message: errorMessage,
      stack: errorDetails,
      error: error
    });
    
    // More specific error messages based on actual error
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF') || errorMessage.includes('Invalid')) {
        throw new Error(`Invalid PDF file: ${errorMessage}. The file may be corrupted or not a valid PDF.`);
      } else if (error.message.includes('password') || errorMessage.toLowerCase().includes('encrypt')) {
        throw new Error('PDF is password-protected or encrypted. Please remove the password and try again.');
      } else if (error.message.includes('No text content')) {
        throw error; // Re-throw the specific message
      } else if (error.message.includes('empty')) {
        throw error;
      } else if (errorMessage.includes('worker')) {
        throw new Error(`PDF.js worker error: ${errorMessage}. Try refreshing the page or check your internet connection.`);
      } else if (errorMessage.includes('fetch')) {
        throw new Error('Failed to load PDF processing library. Check your internet connection and try again.');
      }
    }
    
    // Throw with actual error details for debugging
    throw new Error(`Failed to extract text from PDF: ${errorMessage}\n\nPossible causes:\n- Scanned/image-based PDF (use OCR)\n- Password-protected (remove password)\n- Corrupted file (re-download)\n- Invalid PDF format`);
  }
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Extract text from Word documents (basic support)
 */
async function extractTextFromWord(file: File): Promise<string> {
  try {
    const text = await file.text();
    // Word docs are XML-based, try to extract some text
    return text || `[Word document: ${file.name}]\nNote: Full Word document parsing requires backend processing. Please convert to PDF for better text extraction.`;
  } catch {
    return `[Word document: ${file.name}]\nNote: Could not extract text. Please convert to PDF for better results.`;
  }
}

/**
 * Extract text from PowerPoint files (basic support)
 */
async function extractTextFromPowerPoint(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text || `[PowerPoint file: ${file.name}]\nNote: Full PowerPoint parsing requires backend processing. Please convert to PDF for better text extraction.`;
  } catch {
    return `[PowerPoint file: ${file.name}]\nNote: Could not extract text. Please convert to PDF for better results.`;
  }
}

/**
 * Extract text from any supported file type
 */
export async function extractTextFromFile(file: File): Promise<string> {
  console.log(`Extracting text from: ${file.name} (${file.type})`);
  
  try {
    if (isPDF(file)) {
      return await extractTextFromPDF(file);
    } else if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      // Plain text files
      const text = await file.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Text file is empty');
      }
      return text;
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.type.includes('word')) {
      // Word documents - provide helpful message
      return `File: ${file.name}\nType: Word Document\n\n⚠️ Note: For best results, please convert Word documents to PDF before uploading.\n\nWord files cannot be fully parsed in the browser. Convert to PDF using:\n- Microsoft Word: File → Save As → PDF\n- Google Docs: File → Download → PDF\n- Online converter: word2pdf.com\n\nThis will ensure all content is properly extracted and searchable.`;
    } else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx') || file.type.includes('presentation')) {
      // PowerPoint files - provide helpful message
      return `File: ${file.name}\nType: PowerPoint Presentation\n\n⚠️ Note: For best results, please convert PowerPoint files to PDF before uploading.\n\nPowerPoint files cannot be fully parsed in the browser. Convert to PDF using:\n- Microsoft PowerPoint: File → Save As → PDF\n- Google Slides: File → Download → PDF\n- Online converter: ppt2pdf.com\n\nThis will ensure all slide content is properly extracted.`;
    } else {
      throw new Error(`Unsupported file type: ${file.type || file.name}. Please upload PDF or text files.`);
    }
  } catch (error) {
    console.error('File extraction error:', error);
    throw error;
  }
}

