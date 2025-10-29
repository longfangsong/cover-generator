import { RenderRequest } from '.';
import { GenerationError, GenerationErrorCode } from './error';
import { delay } from '../../utils/delay';

/**
 * Type definitions for PDF generation service
 */

/**
 * Response format from PDF rendering API
 */
export interface RenderResponse {
  /** Success flag */
  success: boolean;

  /** Base64-encoded PDF data (if success) */
  pdfData?: string;

  /** Error message (if !success) */
  error?: string;

  /** Additional metadata */
  metadata?: {
    /** File size in bytes */
    sizeBytes: number;
    /** Generation timestamp */
    generatedAt: string;
    /** Suggested filename from API if available */
    suggestedFilename?: string;
  };
}

/**
 * Configuration for PDF export service
 */
export interface Config {
  /** API endpoint for PDF generation */
  apiEndpoint: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Retry configuration */
  retry?: {
    /** Maximum number of retry attempts (default: 2) */
    maxAttempts: number;
    /** Delay between retries in ms (default: 1000) */
    delayMs: number;
  };
}

/**
 * Implementation of PDF generation service using remote API
 * This service calls a remote PDF rendering API to generate professional PDFs
 * 
 * API Endpoint: https://cvcl-render.jollydesert-dd44d466.swedencentral.azurecontainerapps.io/render
 * 
 * Request Format (POST JSON):
 * {
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "email": "john.doe@example.com",
 *   "homepage": "https://johndoe.com",
 *   "phone": "+1-555-0100",
 *   "github": "johndoe",
 *   "linkedin": "johndoe",
 *   "position": "Senior Software Engineer",
 *   "addressee": "Hiring Manager",
 *   "opening": "...",
 *   "about_me": "...",
 *   "why_me": "...",
 *   "why_company": "..."
 * }
 * 
 * Response: Binary PDF file (application/pdf)
 */
export class PDFExportService {
  private config: Required<Config>;

  constructor(config: Config) {
    this.config = {
      apiEndpoint: config.apiEndpoint,
      timeout: config.timeout ?? 5000,
      retry: {
        maxAttempts: config.retry?.maxAttempts ?? 2,
        delayMs: config.retry?.delayMs ?? 1000,
      },
    };
  }

  /**
   * Generate PDF from cover letter content
   */
  async generatePDF(request: RenderRequest): Promise<RenderResponse> {
    // Validate request
    this.validateRequest(request);

    console.log('[PDFExportService] 🚀 Starting PDF generation with', this.config.retry.maxAttempts + 1, 'max attempts');
    
    // Try with retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          console.log('[PDFExportService] ⏱️ Retry attempt', attempt, 'after', this.config.retry.delayMs, 'ms delay');
          // Wait before retry
          await delay(this.config.retry.delayMs);
        } else {
          console.log('[PDFExportService] 🔄 Attempt', attempt + 1, 'of', this.config.retry.maxAttempts + 1);
        }

        const attemptStartTime = performance.now();
        const response = await this.callAPI(request);
        const attemptDuration = performance.now() - attemptStartTime;
        
        console.log('[PDFExportService] ⏱️ Attempt', attempt + 1, 'completed in', attemptDuration.toFixed(2), 'ms');
        
        if (!response.success || !response.pdfData) {
          throw new GenerationError(
            response.error ?? 'PDF generation failed',
            GenerationErrorCode.GENERATION_FAILED
          );
        }

        console.log('[PDFExportService] ✅ PDF generation successful on attempt', attempt + 1);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn('[PDFExportService] ⚠️ Attempt', attempt + 1, 'failed:', (error as Error).message);
        
        // Don't retry on validation errors
        if (error instanceof GenerationError && 
            error.code === GenerationErrorCode.INVALID_REQUEST) {
          console.error('[PDFExportService] ❌ Validation error, not retrying');
          throw error;
        }
      }
    }

    // All retries failed
    console.error('[PDFExportService] ❌ All', this.config.retry.maxAttempts + 1, 'attempts failed');
    throw lastError ?? new GenerationError(
      'PDF generation failed after retries',
      GenerationErrorCode.UNKNOWN
    );
  }

  /**
   * Download PDF with proper filename
   */
  downloadPDF(pdfData: string, filename: string): void {
    try {
      // Convert base64 to blob
      const binaryData = atob(pdfData);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new GenerationError(
        'Failed to download PDF',
        GenerationErrorCode.UNKNOWN,
        error
      );
    }
  }

  /**
   * Check if PDF service is available
   * Since the API doesn't have a health endpoint, we just check if the endpoint is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try a HEAD request first (less intrusive)
      const response = await fetch(this.config.apiEndpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Accept any response that's not a network error
      // 405 Method Not Allowed is fine - it means the endpoint exists
      return response.status < 500 || response.status === 405;
    } catch (error) {
      // Network error or timeout
      return false;
    }
  }

  /**
   * Make API call to PDF service
   * Uses message passing to background script to avoid CORS issues
   */
  private async callAPI(request: RenderRequest): Promise<RenderResponse> {
    try {
      // Transform request to match API's expected format (snake_case)
      const apiRequest = this.transformRequestForAPI(request);

      // Send message to background script to generate PDF
      // Background script has host_permissions for the PDF API
      const response = await this.sendMessageToBackground(apiRequest);

      if (!response.success) {
        throw new GenerationError(
          response.error || 'PDF generation failed',
          GenerationErrorCode.GENERATION_FAILED
        );
      }

      return {
        success: true,
        pdfData: response.pdfData!,
        metadata: {
          sizeBytes: response.sizeBytes || 0,
          generatedAt: new Date().toISOString(),
          suggestedFilename: response.suggestedFilename,
        },
      };
    } catch (error) {
      if (error instanceof GenerationError) {
        throw error;
      }

      throw new GenerationError(
        'Unknown error during PDF generation',
        GenerationErrorCode.UNKNOWN,
        error
      );
    }
  }

  /**
   * Send message to background script for PDF generation
   */
  private async sendMessageToBackground(apiRequest: Record<string, unknown>): Promise<{
    success: boolean;
    pdfData?: string;
    error?: string;
    sizeBytes?: number;
    suggestedFilename?: string;
  }> {
    // Use browser.runtime if available (webextension-polyfill), fallback to chrome.runtime
    const runtime = (globalThis as any).browser?.runtime || (globalThis as any).chrome?.runtime;
    
    if (!runtime) {
      throw new GenerationError(
        'Browser runtime not available',
        GenerationErrorCode.UNKNOWN
      );
    }

    const messageStartTime = performance.now();
    console.log('[PDFExportService] 📤 Sending message to background script...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const elapsed = performance.now() - messageStartTime;
        console.error('[PDFExportService] ⏱️ Message timeout after', elapsed.toFixed(2), 'ms');
        reject(new GenerationError(
          'Request timeout: Background script did not respond',
          GenerationErrorCode.TIMEOUT
        ));
      }, this.config.timeout);

      runtime.sendMessage(
        {
          type: 'GENERATE_PDF',
          payload: apiRequest,
        },
        (response: any) => {
          clearTimeout(timeout);
          
          const messageEndTime = performance.now();
          const messageDuration = messageEndTime - messageStartTime;
          console.log('[PDFExportService] 📥 Received response from background in', messageDuration.toFixed(2), 'ms');
          
          if (runtime.lastError) {
            console.error('[PDFExportService] ❌ Message passing failed:', runtime.lastError.message);
            reject(new GenerationError(
              `Message passing failed: ${runtime.lastError.message}`,
              GenerationErrorCode.UNKNOWN
            ));
            return;
          }

          if (response?.timings) {
            console.log('[PDFExportService] 📊 Background timing breakdown:', response.timings);
          }

          resolve(response);
        }
      );
    });
  }

  /**
   * Transform our internal request format to API's expected format
   */
  private transformRequestForAPI(request: RenderRequest): Record<string, unknown> {
    // Split name into first_name and last_name
    const nameParts = request.userProfile.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      first_name: firstName,
      last_name: lastName,
      email: request.userProfile.email || '',
      phone: request.userProfile.phone || '',
      position: request.jobDetails.position,
      addressee: request.content.addressee,
      opening: request.content.opening,
      about_me: request.content.aboutMe,
      why_me: request.content.whyMe,
      why_company: request.content.whyCompany,
    };
  }

  /**
   * Validate render request
   */
  private validateRequest(request: RenderRequest): void {
    if (!request.content) {
      throw new GenerationError(
        'Invalid request: missing content',
        GenerationErrorCode.INVALID_REQUEST
      );
    }

    if (!request.userProfile?.name) {
      throw new GenerationError(
        'Invalid request: missing user name',
        GenerationErrorCode.INVALID_REQUEST
      );
    }

    if (!request.jobDetails?.company || !request.jobDetails?.position) {
      throw new GenerationError(
        'Invalid request: missing job details',
        GenerationErrorCode.INVALID_REQUEST
      );
    }

    // Validate content sections
    const requiredSections = ['opening', 'aboutMe', 'whyMe', 'whyCompany'];
    for (const section of requiredSections) {
      if (!request.content[section as keyof typeof request.content]) {
        throw new GenerationError(
          `Invalid request: missing section "${section}"`,
          GenerationErrorCode.INVALID_REQUEST
        );
      }
    }
  }
}

/**
 * Factory function to create PDF export service
 */
export function createPDFExportService(
  apiEndpoint: string = 'https://cvcl-render.jollydesert-dd44d466.swedencentral.azurecontainerapps.io/render'
): PDFExportService {
  return new PDFExportService({
    apiEndpoint,
    timeout: 30000,
    retry: {
      maxAttempts: 2,
      delayMs: 1000,
    },
  });
}
