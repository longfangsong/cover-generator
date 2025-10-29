import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { JobDetails } from '../../models/JobDetails';
import { BrowserStorageService } from '../../infra/storage/BrowserStorageService';
import { JobDetailsDisplay } from './JobDetailsDisplay';
import './JobExtraction.css';

const storageService = new BrowserStorageService();

interface JobExtractionProps {
  onJobExtracted?: (job: JobDetails) => void;
}

/**
 * Component for extracting job details from current page
 */
export const JobExtraction: React.FC<JobExtractionProps> = ({ onJobExtracted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    // Get current tab URL
    console.log('[JobExtraction] Initializing - querying active tab');
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        console.log('[JobExtraction] Active tabs:', tabs);
        if (tabs[0]?.url) {
          console.log('[JobExtraction] Current URL:', tabs[0].url);
          setCurrentUrl(tabs[0].url);
          // Try to load cached job details for this URL
          return storageService.getCachedJob(tabs[0].url);
        }
        return null;
      })
      .then(cached => {
        if (cached) {
          console.log('[JobExtraction] Loaded cached job:', cached);
          setJobDetails(cached);
          // Notify parent component about cached job details
          if (onJobExtracted) {
            onJobExtracted(cached);
          }
        } else {
          console.log('[JobExtraction] No cached job found');
        }
      })
      .catch(err => {
        console.error('[JobExtraction] Failed to load cached job:', err);
      });
  }, [onJobExtracted]);

  const handleExtractJob = async () => {
    console.log('[JobExtraction] Extract button clicked');
    setIsLoading(true);
    setError(null);

    try {
      // Query active tab
      console.log('[JobExtraction] Querying active tab...');
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      console.log('[JobExtraction] Found tabs:', tabs);
      
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const currentTabUrl = tabs[0].url || '';
      console.log('[JobExtraction] Current tab URL:', currentTabUrl);
      console.log('[JobExtraction] Tab ID:', tabs[0].id);

      // Check if we're on a supported page
      const isSupportedPage = currentTabUrl.includes('linkedin.com/jobs') || 
                              currentTabUrl.includes('arbetsformedlingen.se/platsbanken/annonser');
      
      console.log('[JobExtraction] Is supported page?', isSupportedPage);
      console.log('[JobExtraction] LinkedIn check:', currentTabUrl.includes('linkedin.com/jobs'));
      console.log('[JobExtraction] Arbetsförmedlingen check:', currentTabUrl.includes('arbetsformedlingen.se/platsbanken/annonser'));
      
      if (!isSupportedPage) {
        throw new Error('Please navigate to a LinkedIn or Arbetsförmedlingen job posting to extract job details');
      }

      // Try to send message to content script
      try {
        console.log('[JobExtraction] Sending EXTRACT_JOB_DETAILS message to tab:', tabs[0].id);
        const response = await browser.tabs.sendMessage(tabs[0].id, {
          type: 'EXTRACT_JOB_DETAILS',
        }) as { success: boolean; data?: JobDetails; error?: string };

        console.log('[JobExtraction] Received response:', response);

        if (response.success && response.data) {
          console.log('[JobExtraction] Extraction successful:', response.data);
          setJobDetails(response.data);
          // Cache the extracted job details
          await storageService.cacheJobDetails(response.data);
          setError(null);
          // Notify parent component
          if (onJobExtracted) {
            onJobExtracted(response.data);
          }
        } else {
          console.error('[JobExtraction] Extraction failed:', response.error);
          setError(response.error || 'Failed to extract job details');
          setJobDetails(null);
        }
      } catch (msgError) {
        // Content script not loaded - this can happen if:
        // 1. Page hasn't finished loading
        // 2. Content script injection failed
        // 3. User clicked too fast
        console.error('[JobExtraction] Message sending failed:', msgError);
        throw new Error(
          'Content script not ready. Please refresh the page and try again, or enter details manually.'
        );
      }
    } catch (err) {
      console.error('[JobExtraction] Extraction error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Cannot auto-detect job details. Please enter job information manually.'
      );
      setJobDetails(null);
    } finally {
      console.log('[JobExtraction] Extraction complete, loading:', false);
      setIsLoading(false);
    }
  };

  const handleJobUpdate = async (updated: JobDetails) => {
    setJobDetails(updated);
    // Update cache with edited details
    await storageService.cacheJobDetails(updated);
    // Notify parent component
    if (onJobExtracted) {
      onJobExtracted(updated);
    }
  };

  const isSupportedJobPage = currentUrl.includes('linkedin.com/jobs') || 
                              currentUrl.includes('arbetsformedlingen.se/platsbanken/annonser');

  return (
    <div className="job-extraction">
      <div className="extraction-header">
        <h2>Job Details</h2>
        {!jobDetails && (
          <button
            onClick={handleExtractJob}
            disabled={isLoading || !isSupportedJobPage}
            className="btn-extract"
            title={!isSupportedJobPage ? 'Navigate to a supported job posting (LinkedIn or Arbetsförmedlingen) to extract details' : ''}
          >
            {isLoading ? 'Extracting...' : 'Extract from Page'}
          </button>
        )}
      </div>

      {!isSupportedJobPage && !jobDetails && (
        <div className="info-message">
          <p>
            Navigate to a LinkedIn or Arbetsförmedlingen job posting, then click "Extract from Page" to automatically fill in job details.
          </p>
          <p className="small-text">
            Or enter job information manually below.
          </p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Cannot auto-detect job details</strong>
          <p>{error}</p>
          <p className="small-text">Please enter job information manually or try a different page.</p>
        </div>
      )}

      {jobDetails && (
        <JobDetailsDisplay
          jobDetails={jobDetails}
          onUpdate={handleJobUpdate}
        />
      )}

      {!jobDetails && !error && !isLoading && isSupportedJobPage && (
        <div className="prompt-message">
          <p>Click "Extract from Page" to automatically extract job details from this posting.</p>
        </div>
      )}
    </div>
  );
};
