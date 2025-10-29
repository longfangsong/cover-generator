/**
 * Content script for extracting job details from web pages
 * Injected into job posting pages when user clicks the extension icon
 */

import { JobDetails } from '../../models/JobDetails';
import { ExtractorRegistry } from './registry';
import { LinkedInExtractor } from './platforms/linkedin';
import { ArbetsformedlingenExtractor } from './platforms/arbetsformedlingen';
import { ManualExtractor } from './platforms/manual';

// Initialize extractor registry
const registry = new ExtractorRegistry();
registry.register(new LinkedInExtractor());
registry.register(new ArbetsformedlingenExtractor());
registry.register(new ManualExtractor()); // Always register manual as fallback

console.log('[Content Script] Job extraction content script loaded on:', window.location.href);
console.log('[Content Script] Registered extractors:', registry.getAll().map(e => ({ id: e.id, name: e.name })));

/**
 * Extract job details from current page
 */
async function extractJobDetails(): Promise<{ success: boolean; data?: JobDetails; error?: string }> {
  try {
    const currentUrl = window.location.href;
    
    console.log('[Content Script] ====== Starting Extraction ======');
    console.log('[Content Script] Current URL:', currentUrl);
    console.log('[Content Script] Document ready state:', document.readyState);
    
    // Check each extractor
    const allExtractors = registry.getAll();
    console.log('[Content Script] Testing', allExtractors.length, 'extractors:');
    for (const ext of allExtractors) {
      const canExtract = ext.canExtract(currentUrl);
      console.log(`[Content Script]   - ${ext.name} (${ext.id}): canExtract = ${canExtract}`);
    }
    
    const extractor = registry.findExtractor(currentUrl);

    if (!extractor) {
      console.error('[Content Script] No suitable extractor found!');
      return {
        success: false,
        error: 'No suitable extractor found for this page',
      };
    }

    console.log('[Content Script] Selected extractor:', extractor.name, '(' + extractor.id + ')');

    const jobDetails = await extractor.extract(document);

    if (!jobDetails) {
      console.error('[Content Script] Extractor returned null');
      return {
        success: false,
        error: 'Failed to extract job details from page',
      };
    }

    console.log('[Content Script] Successfully extracted job details:', jobDetails);

    return {
      success: true,
      data: jobDetails,
    };
  } catch (error) {
    console.error('[Content Script] Extraction error:', error);
    if (error instanceof Error) {
      console.error('[Content Script] Error stack:', error.stack);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during extraction',
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(
  (
    message: { type: string },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; data?: JobDetails; error?: string }) => void
  ) => {
    console.log('[Content Script] ====== Message Received ======');
    console.log('[Content Script] Message type:', message.type);
    console.log('[Content Script] Sender:', sender);
    console.log('[Content Script] Current URL:', window.location.href);
    
    if (message.type === 'EXTRACT_JOB_DETAILS') {
      console.log('[Content Script] Processing EXTRACT_JOB_DETAILS request...');
      extractJobDetails()
        .then(result => {
          console.log('[Content Script] Extraction complete, sending response:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('[Content Script] Error processing extraction:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      // Return true to indicate we'll send response asynchronously
      return true;
    }
    console.log('[Content Script] Ignoring message with type:', message.type);
    return false;
  }
);

// Notify background script that content script is ready
console.log('[Content Script] Sending ready notification');
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }).catch(err => {
  console.log('[Content Script] Could not notify background (this is ok if background is not listening):', err);
});

export {};
