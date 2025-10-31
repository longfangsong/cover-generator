import { PDFExportRequest, PDFExportResponse } from "@/models/pdfExport";
import { blobToBase64 } from "@/utils/blobToBase64";
import browser from "webextension-polyfill";

const API_ENDPOINT = 'https://cvcl-render.jollydesert-dd44d466.swedencentral.azurecontainerapps.io/';

const WAKEUP_DEBOUNCE_MS = 10 * 60 * 1000; // 10 minutes
const WAKEUP_STORAGE_KEY = 'pdfServiceLastWakeup';


async function getLastWakeupTime(): Promise<number> {
  if (typeof browser !== 'undefined') {
    const result = await browser.storage.local.get(WAKEUP_STORAGE_KEY);
    const value = result[WAKEUP_STORAGE_KEY];
    return typeof value === 'number' ? value : 0;
  }
  return 0;
}

async function setLastWakeupTime(ts: number) {
  await browser.storage.local.set({[WAKEUP_STORAGE_KEY]: ts});
}

export async function wakeupPDFService(): Promise<void> {
  const now = Date.now();
  const lastWakeupTime = await getLastWakeupTime();
  if (now - lastWakeupTime < WAKEUP_DEBOUNCE_MS) {
    return;
  }
  await setLastWakeupTime(now);
  try {
    // no need to await the response
    fetch(`${API_ENDPOINT}health`);
  } catch {
    // Ignore errors
  }
}

/**
 * Handle PDF generation in background script to avoid CORS issues
 * Background scripts have broader permissions than popup/content scripts
 */
export async function exportPDF(request: PDFExportRequest): Promise<PDFExportResponse | Error> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[Background] Generating PDF for ${request.position} (attempt ${attempt})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_ENDPOINT}render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          // TODO: use real user data
          homepage: '',
          github: '',
          linkedin: '',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = Error(`PDF generation failed: ${response.status} ${response.statusText}`);
        continue;
      }

      // Extract filename from content-disposition header if available
      let suggestedFilename: string | undefined;
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=(?:"([^"]*)"|([^;,"]*))/);
        if (filenameMatch) {
          suggestedFilename = filenameMatch[1] || filenameMatch[2];
        }
      }

      // Get the PDF blob    
      const blob = await response.blob();
      
      // Convert blob to base64    
      const base64Data = await blobToBase64(blob);
      return {
        pdfData: base64Data,
        suggestedFilename,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // retry
    }
  }
  return Error(`PDF generation error after 3 attempts: ${lastError ? lastError.message : 'Unknown error'}`);
}