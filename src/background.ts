import browser from "webextension-polyfill";
import { processGenerationJob } from "./services/generationWorker";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

/**
 * Message handler for communication between content scripts and popup
 */
browser.runtime.onMessage.addListener((message, sender) => {
  console.log('Background received message:', message, 'from', sender);

  if (message.type === 'CONTENT_SCRIPT_READY') {
    console.log('Content script is ready on tab:', sender.tab?.id);
    return Promise.resolve({ received: true });
  }

  if (message.type === 'EXTRACT_JOB_DETAILS') {
    // Forward the message to the active tab's content script
    return browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs[0]?.id) {
          return browser.tabs.sendMessage(tabs[0].id, message);
        }
        return Promise.reject(new Error('No active tab found'));
      });
  }

  if (message.type === 'GENERATE_PDF') {
    // Handle PDF generation request from popup
    // This runs in the background script which has host_permissions for the PDF API
    return handlePDFGeneration(message.payload);
  }

  if (message.type === 'START_GENERATION_JOB') {
    // Start processing a generation job in the background
    const { jobId } = message.payload;
    console.log('Starting generation job:', jobId);
    
    // Process job asynchronously (don't block the message handler)
    processGenerationJob(jobId).catch(error => {
      console.error('Failed to process generation job:', error);
    });
    
    return Promise.resolve({ success: true, jobId });
  }

  return Promise.resolve();
});

/**
 * Handle PDF generation in background script to avoid CORS issues
 * Background scripts have broader permissions than popup/content scripts
 */
async function handlePDFGeneration(payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  addressee: string;
  opening: string;
  about_me: string;
  why_me: string;
  why_company: string;
}): Promise<{ success: boolean; pdfData?: string; error?: string; sizeBytes?: number; suggestedFilename?: string; timings?: any }> {
  const API_ENDPOINT = 'https://cvcl-render.jollydesert-dd44d466.swedencentral.azurecontainerapps.io/render';
  
  // Performance tracking
  const startTime = performance.now();
  const timings: any = {
    start: new Date().toISOString(),
  };
  
  try {
    console.log('[Background] 🚀 Starting PDF generation at', timings.start);
    console.log('[Background] Payload size:', JSON.stringify(payload).length, 'bytes');
    console.log('[Background] Generating PDF with payload:', {
      ...payload,
      opening: payload.opening.substring(0, 50) + '...',
      about_me: payload.about_me.substring(0, 50) + '...',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const fetchStartTime = performance.now();
    timings.fetchStart = fetchStartTime - startTime;
    console.log('[Background] ⏱️ Initiating fetch request...');

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        homepage: '',
        github: '',
        linkedin: '',
      }),
      signal: controller.signal,
    });

    const fetchEndTime = performance.now();
    timings.fetchDuration = fetchEndTime - fetchStartTime;
    timings.fetchEnd = fetchEndTime - startTime;
    console.log('[Background] ✅ Fetch completed in', timings.fetchDuration.toFixed(2), 'ms');

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[Background] ❌ PDF API error:', response.status, response.statusText);
      timings.totalDuration = performance.now() - startTime;
      return {
        success: false,
        error: `API returned ${response.status}: ${response.statusText}`,
        timings,
      };
    }

    // Extract filename from content-disposition header if available
    let suggestedFilename: string | undefined;
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename\*?=(?:"([^"]*)"|([^;,\s]*))/);
      if (filenameMatch) {
        suggestedFilename = filenameMatch[1] || filenameMatch[2];
        console.log('[Background] 📄 Filename from header:', suggestedFilename);
      }
    }

    // Get the PDF blob
    const blobStartTime = performance.now();
    timings.blobStart = blobStartTime - startTime;
    console.log('[Background] ⏱️ Converting response to blob...');
    
    const blob = await response.blob();
    
    const blobEndTime = performance.now();
    timings.blobDuration = blobEndTime - blobStartTime;
    timings.blobEnd = blobEndTime - startTime;
    console.log('[Background] ✅ Blob conversion completed in', timings.blobDuration.toFixed(2), 'ms');
    console.log('[Background] 📦 PDF size:', blob.size, 'bytes', `(${(blob.size / 1024).toFixed(2)} KB)`);

    // Convert blob to base64
    const base64StartTime = performance.now();
    timings.base64Start = base64StartTime - startTime;
    console.log('[Background] ⏱️ Converting blob to base64...');
    
    const base64Data = await blobToBase64(blob);
    
    const base64EndTime = performance.now();
    timings.base64Duration = base64EndTime - base64StartTime;
    timings.base64End = base64EndTime - startTime;
    console.log('[Background] ✅ Base64 conversion completed in', timings.base64Duration.toFixed(2), 'ms');
    console.log('[Background] 📦 Base64 size:', base64Data.length, 'bytes', `(${(base64Data.length / 1024).toFixed(2)} KB)`);

    timings.totalDuration = performance.now() - startTime;
    timings.end = new Date().toISOString();
    
    console.log('[Background] 🎉 PDF generation completed successfully!');
    console.log('[Background] ⏱️ TOTAL TIME:', timings.totalDuration.toFixed(2), 'ms');
    console.log('[Background] 📊 Performance breakdown:', {
      fetch: `${timings.fetchDuration.toFixed(2)}ms (${((timings.fetchDuration / timings.totalDuration) * 100).toFixed(1)}%)`,
      blob: `${timings.blobDuration.toFixed(2)}ms (${((timings.blobDuration / timings.totalDuration) * 100).toFixed(1)}%)`,
      base64: `${timings.base64Duration.toFixed(2)}ms (${((timings.base64Duration / timings.totalDuration) * 100).toFixed(1)}%)`,
    });

    return {
      success: true,
      pdfData: base64Data,
      sizeBytes: blob.size,
      suggestedFilename,
      timings,
    };
  } catch (error) {
    const errorTime = performance.now();
    timings.totalDuration = errorTime - startTime;
    timings.end = new Date().toISOString();
    timings.error = true;
    
    console.error('[Background] ❌ PDF generation failed after', timings.totalDuration.toFixed(2), 'ms');
    console.error('[Background] Error details:', error);
    
    if ((error as Error).name === 'AbortError') {
      console.error('[Background] ⏱️ Request timed out after 30s');
      return {
        success: false,
        error: 'Request timeout: PDF service did not respond',
        timings,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timings,
    };
  }
}

/**
 * Convert blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data:application/pdf;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
