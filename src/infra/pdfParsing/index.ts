/**
 * PDFParserService - Extract text content from PDF files
 * 
 * Uses pdfjs-dist to parse PDF files in a worker thread to avoid blocking the UI.
 * Extracts all text content from all pages.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface PDFParseResult {
  text: string;
  pageCount: number;
  links: string[];
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

export interface PDFParseError {
  type: 'file-too-large' | 'invalid-pdf' | 'password-protected' | 'corrupted' | 'extraction-failed';
  message: string;
}

export class PDFParserService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Parse a PDF file and extract all text content
   * 
   * @param file - PDF file to parse
   * @returns Extracted text and metadata
   * @throws PDFParseError if parsing fails
   */
  async parseFile(file: File): Promise<PDFParseResult> {''
    // Validate file size
    if (file.size > PDFParserService.MAX_FILE_SIZE) {
      throw {
        type: 'file-too-large',
        message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 5MB`
      } as PDFParseError;
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw {
        type: 'invalid-pdf',
        message: 'File must be a PDF document'
      } as PDFParseError;
    }

    try {
      // Read file as array buffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      // Extract metadata
      const metadata = await this.extractMetadata(pdf);

      // Extract text from all pages
      const text = await this.extractAllText(pdf);

      // Extract links from all pages
      const links = await this.extractAllLinks(pdf);

      return {
        text,
        pageCount: pdf.numPages,
        links,
        metadata
      };
    } catch (error: any) {
      // Handle specific PDF.js errors
      if (error?.message?.includes('password')) {
        throw {
          type: 'password-protected',
          message: 'PDF is password-protected. Please provide an unprotected version.'
        } as PDFParseError;
      }

      if (error?.message?.includes('Invalid PDF')) {
        throw {
          type: 'corrupted',
          message: 'PDF file appears to be corrupted or invalid'
        } as PDFParseError;
      }

      // Generic extraction failure
      throw {
        type: 'extraction-failed',
        message: `Failed to parse PDF: ${error?.message || 'Unknown error'}`
      } as PDFParseError;
    }
  }

  /**
   * Read file as ArrayBuffer (for PDF.js)
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract metadata from PDF document
   */
  private async extractMetadata(pdf: pdfjsLib.PDFDocumentProxy): Promise<PDFParseResult['metadata']> {
    try {
      const metadata = await pdf.getMetadata();
      const info = metadata.info as any;
      return {
        title: info?.Title,
        author: info?.Author,
        subject: info?.Subject,
        keywords: info?.Keywords
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Extract text from all pages of the PDF
   */
  private async extractAllText(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
    const textParts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with proper spacing
      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      
      textParts.push(pageText);
    }

    // Join all pages with double newline
    return textParts
      .filter(text => text.trim().length > 0)
      .join('\n\n')
      .trim();
  }

  /**
   * Extract all links from the PDF
   */
  private async extractAllLinks(pdf: pdfjsLib.PDFDocumentProxy): Promise<string[]> {
    const links = new Set<string>();

    // Extract links from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      try {
        const annotations = await page.getAnnotations();
        
        // Process each annotation
        for (const annotation of annotations) {
          // Check for link annotations
          if (annotation.subtype === 'Link') {
            // URL in annotation
            if (annotation.url) {
              links.add(annotation.url);
            }
            
            // Destination URL
            if (annotation.dest) {
              // Internal link - skip for now
              continue;
            }
            
            // Action with URI
            if (annotation.action?.url) {
              links.add(annotation.action.url);
            }
          }
        }
      } catch (error) {
        // Continue if annotation extraction fails for a page
        console.warn(`Failed to extract annotations from page ${pageNum}:`, error);
      }
    }

    return Array.from(links);
  }

  /**
   * Validate if a file is a valid PDF (without parsing)
   */
  async validateFile(file: File): Promise<{ valid: boolean; error?: PDFParseError }> {
    // Check file size
    if (file.size > PDFParserService.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: {
          type: 'file-too-large',
          message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 5MB`
        }
      };
    }

    // Check file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return {
        valid: false,
        error: {
          type: 'invalid-pdf',
          message: 'File must be a PDF document'
        }
      };
    }

    return { valid: true };
  }
}

// Singleton instance
export const pdfParserService = new PDFParserService();
