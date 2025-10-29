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
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url);
          // Try to load cached job details for this URL
          return storageService.getCachedJob(tabs[0].url);
        }
        return null;
      })
      .then(cached => {
        if (cached) {
          setJobDetails(cached);
          // Notify parent component about cached job details
          if (onJobExtracted) {
            onJobExtracted(cached);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load cached job:', err);
      });
  }, [onJobExtracted]);

  const handleExtractJob = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Query active tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const currentTabUrl = tabs[0].url || '';

      // Check if we're on a supported page
      if (!currentTabUrl.includes('linkedin.com/jobs')) {
        throw new Error('Please navigate to a LinkedIn job posting to extract job details');
      }

      // Try to send message to content script
      try {
        const response = await browser.tabs.sendMessage(tabs[0].id, {
          type: 'EXTRACT_JOB_DETAILS',
        }) as { success: boolean; data?: JobDetails; error?: string };

        if (response.success && response.data) {
          setJobDetails(response.data);
          // Cache the extracted job details
          await storageService.cacheJobDetails(response.data);
          setError(null);
          // Notify parent component
          if (onJobExtracted) {
            onJobExtracted(response.data);
          }
        } else {
          setError(response.error || 'Failed to extract job details');
          setJobDetails(null);
        }
      } catch (msgError) {
        // Content script not loaded - this can happen if:
        // 1. Page hasn't finished loading
        // 2. Content script injection failed
        // 3. User clicked too fast
        console.error('Message sending failed:', msgError);
        throw new Error(
          'Content script not ready. Please refresh the page and try again, or enter details manually.'
        );
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Cannot auto-detect job details. Please enter job information manually.'
      );
      setJobDetails(null);
    } finally {
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

  const isLinkedInJobPage = currentUrl.includes('linkedin.com/jobs');

  return (
    <div className="job-extraction">
      <div className="extraction-header">
        <h2>Job Details</h2>
        {!jobDetails && (
          <button
            onClick={handleExtractJob}
            disabled={isLoading || !isLinkedInJobPage}
            className="btn-extract"
            title={!isLinkedInJobPage ? 'Navigate to a LinkedIn job posting to extract details' : ''}
          >
            {isLoading ? 'Extracting...' : 'Extract from Page'}
          </button>
        )}
      </div>

      {!isLinkedInJobPage && !jobDetails && (
        <div className="info-message">
          <p>
            Navigate to a LinkedIn job posting, then click "Extract from Page" to automatically fill in job details.
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

      {!jobDetails && !error && !isLoading && isLinkedInJobPage && (
        <div className="prompt-message">
          <p>Click "Extract from Page" to automatically extract job details from this LinkedIn posting.</p>
        </div>
      )}
    </div>
  );
};
