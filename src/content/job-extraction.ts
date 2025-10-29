/**
 * Content script for extracting job details from web pages
 * Injected into job posting pages when user clicks the extension icon
 */

import { JobDetails } from '../models/JobDetails';
import { ExtractorRegistry } from '../services/jobExtractor/registry';
import { LinkedInExtractor } from '../services/jobExtractor/platforms/linkedin';
import { ManualExtractor } from '../services/jobExtractor/platforms/manual';

// Initialize extractor registry
const registry = new ExtractorRegistry();
registry.register(new LinkedInExtractor());
registry.register(new ManualExtractor()); // Always register manual as fallback

console.log('[Content Script] Job extraction content script loaded on:', window.location.href);

/**
 * Extract job details from current page
 */
async function extractJobDetails(): Promise<{ success: boolean; data?: JobDetails; error?: string }> {
  try {
    const currentUrl = window.location.href;
    
    console.log('[Content Script] Attempting extraction from:', currentUrl);
    
    const extractor = registry.findExtractor(currentUrl);

    if (!extractor) {
      return {
        success: false,
        error: 'No suitable extractor found for this page',
      };
    }

    console.log('[Content Script] Using extractor:', extractor.name);

    const jobDetails = await extractor.extract(document);

    if (!jobDetails) {
      return {
        success: false,
        error: 'Failed to extract job details from page',
      };
    }

    console.log('[Content Script] Successfully extracted:', jobDetails);

    return {
      success: true,
      data: jobDetails,
    };
  } catch (error) {
    console.error('[Content Script] Extraction error:', error);
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
    console.log('[Content Script] Received message:', message);
    
    if (message.type === 'EXTRACT_JOB_DETAILS') {
      extractJobDetails()
        .then(result => {
          console.log('[Content Script] Sending response:', result);
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
    return false;
  }
);

// Notify background script that content script is ready
console.log('[Content Script] Sending ready notification');
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }).catch(err => {
  console.log('[Content Script] Could not notify background (this is ok if background is not listening):', err);
});

export {};
