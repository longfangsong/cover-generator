/**
 * Content script for extracting job details from web pages
 * Injected into job posting pages when user clicks the extension icon
 */

import { Message } from "./api";
import { JobDetails } from "@/models/jobDetails";
import { ArbetsformedlingenExtractor } from "@/services/jobExtractor/platforms/arbetsformedlingen";
import { LinkedInExtractor } from "@/services/jobExtractor/platforms/linkedin";
import { ManualExtractor } from "@/services/jobExtractor/platforms/manual";
import { ExtractorRegistry } from "@/services/jobExtractor/registry";
import browser from "webextension-polyfill";

const registry = new ExtractorRegistry();
registry.register(new LinkedInExtractor());
registry.register(new ArbetsformedlingenExtractor());
registry.register(new ManualExtractor()); // Always register manual as fallback

/**
 * Extract job details from current page
 */
async function extractJobDetails(): Promise<JobDetails | Error> {
  try {
    const currentUrl = window.location.href;
    
    const extractor = registry.findExtractor(currentUrl);

    if (!extractor) {
      return new Error('No suitable extractor found for this page');
    }

    const jobDetails = await extractor.extract(document);

    if (!jobDetails) {
      return new Error('Failed to extract job details from the page');
    }
    return jobDetails;
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    return new Error('Unknown error during job extraction');
  }
}


browser.runtime.onMessage.addListener((msg: unknown) => {
  const message = msg as Message;
  console.log('Content received message:', message);
  if (message.type === 'EXTRACT_JOB_DETAILS') {
    return extractJobDetails();
  } else {
    return;
  }
});

// Notify background script that content script is ready
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });
