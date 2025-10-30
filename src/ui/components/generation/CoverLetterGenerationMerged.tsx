/**
 * CoverLetterWorkflow Component
 * Integrates job extraction, generation instructions, and cover letter generation workflow
 */

import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { UserProfile } from '../../../models/UserProfile';
import { JobDetails } from '../../../models/JobDetails';
import { LLMProviderConfig } from '../../../models/LLMProviderConfig';
import { GenerationButton } from './GenerationButton';
import { JobDetailsForm } from './JobDetailsForm';
import { GenerationInstructionsForm } from './GenerationInstructionsForm';
import { validateInputs } from '../../../services/coverLetterGeneration';
import { SectionInstructions } from '../../../services/coverLetterGeneration/prompt';
import { BrowserStorageService } from '../../../infra/storage';
import { createGenerationJob } from '../../../models/GenerationJob';
import './JobExtraction.css';

const storageService = new BrowserStorageService();

interface CoverLetterWorkflowProps {
  profile: UserProfile | null;
  providerConfig: LLMProviderConfig | null;
  onJobExtracted?: (job: JobDetails) => void;
  onGenerationStarted?: () => void;
}

export const CoverLetterWorkflow: React.FC<CoverLetterWorkflowProps> = ({
  profile,
  providerConfig,
  onJobExtracted,
  onGenerationStarted
}) => {
  // Job extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  // Generation instructions state
  const [instructions, setInstructions] = useState<SectionInstructions>({});

  // Cover letter generation state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached job details on mount and auto-extract if on supported job site
  useEffect(() => {
    console.log('[CoverLetterWorkflow] Component mounted, checking for job extraction');
    let currentTabUrl = '';

    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        console.log('[CoverLetterWorkflow] Active tabs:', tabs);
        if (tabs[0]?.url) {
          currentTabUrl = tabs[0].url;
          console.log('[CoverLetterWorkflow] Current URL:', currentTabUrl);
          setCurrentUrl(currentTabUrl);
          return storageService.getCachedJob(currentTabUrl);
        }
        return null;
      })
      .then(cached => {
        if (cached) {
          console.log('[CoverLetterWorkflow] Found cached job:', cached);
          setJobDetails(cached);
          if (onJobExtracted) {
            onJobExtracted(cached);
          }
        } else {
          // Auto-extract if on supported job page and no cache
          const isSupportedPage = currentTabUrl.includes('linkedin.com/jobs') || 
                                   currentTabUrl.includes('arbetsformedlingen.se/platsbanken/annonser');
          console.log('[CoverLetterWorkflow] Is supported page?', isSupportedPage);
          console.log('[CoverLetterWorkflow] LinkedIn check:', currentTabUrl.includes('linkedin.com/jobs'));
          console.log('[CoverLetterWorkflow] Arbetsförmedlingen check:', currentTabUrl.includes('arbetsformedlingen.se/platsbanken/annonser'));
          
          if (isSupportedPage) {
            console.log('[CoverLetterWorkflow] Auto-extracting job details...');
            handleExtractJob();
          } else {
            console.log('[CoverLetterWorkflow] Not a supported job page, skipping auto-extraction');
          }
        }
      })
      .catch(err => {
        console.error('[CoverLetterWorkflow] Failed to load cached job:', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleExtractJob = async () => {
    console.log('[CoverLetterWorkflow] handleExtractJob called');
    setIsExtracting(true);
    setExtractionError(null);

    try {
      console.log('[CoverLetterWorkflow] Querying active tab...');
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      console.log('[CoverLetterWorkflow] Found tabs:', tabs);

      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const currentTabUrl = tabs[0].url || '';
      console.log('[CoverLetterWorkflow] Current tab URL:', currentTabUrl);
      console.log('[CoverLetterWorkflow] Tab ID:', tabs[0].id);

      // Check if we're on a supported page
      const isSupportedPage = currentTabUrl.includes('linkedin.com/jobs') || 
                              currentTabUrl.includes('arbetsformedlingen.se/platsbanken/annonser');
      
      console.log('[CoverLetterWorkflow] Is supported page?', isSupportedPage);

      if (!isSupportedPage) {
        throw new Error('Please navigate to a LinkedIn or Arbetsförmedlingen job posting to extract job details');
      }

      try {
        console.log('[CoverLetterWorkflow] Sending EXTRACT_JOB_DETAILS message to tab:', tabs[0].id);
        const response = await browser.tabs.sendMessage(tabs[0].id, {
          type: 'EXTRACT_JOB_DETAILS',
        }) as { success: boolean; data?: JobDetails; error?: string };

        console.log('[CoverLetterWorkflow] Received response:', response);

        if (response.success && response.data) {
          console.log('[CoverLetterWorkflow] Extraction successful:', response.data);
          setJobDetails(response.data);
          await storageService.cacheJobDetails(response.data);
          setExtractionError(null);
          if (onJobExtracted) {
            onJobExtracted(response.data);
          }
        } else {
          console.error('[CoverLetterWorkflow] Extraction failed:', response.error);
          setExtractionError(response.error || 'Failed to extract job details');
        }
      } catch (msgError) {
        console.error('[CoverLetterWorkflow] Message sending failed:', msgError);
        throw new Error(
          'Content script not ready. Please refresh the page and try again.'
        );
      }
    } catch (err) {
      console.error('[CoverLetterWorkflow] Extraction error:', err);
      setExtractionError(
        err instanceof Error
          ? err.message
          : 'Cannot auto-detect job details. Please enter job information manually.'
      );
    } finally {
      console.log('[CoverLetterWorkflow] Extraction complete, loading:', false);
      setIsExtracting(false);
    }
  };

  const handleJobUpdate = async (updated: JobDetails) => {
    setJobDetails(updated);
    await storageService.cacheJobDetails(updated);
    if (onJobExtracted) {
      onJobExtracted(updated);
    }
  };

  const handleInstructionsUpdate = (newInstructions: SectionInstructions) => {
    setInstructions(newInstructions);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!providerConfig) {
        setError('Please configure your LLM provider in Settings first');
        setLoading(false);
        return;
      }

      const validation = await validateInputs(profile, jobDetails);
      if (!validation.valid) {
        setError(validation.error || 'Validation failed');
        setLoading(false);
        return;
      }

      // Always use background generation
      const job = createGenerationJob(
        profile!,
        jobDetails!,
        {
          instructions: Object.keys(instructions).length > 0 ? instructions : undefined,
          model: providerConfig.model,
          temperature: providerConfig.temperature,
          maxTokens: providerConfig.maxTokens,
        }
      );

      console.log('[CoverLetterWorkflow] Creating job:', job);
      await storageService.saveGenerationJob(job);
      console.log('[CoverLetterWorkflow] Job saved to storage');

      // Send message to background script to start processing
      const response = await browser.runtime.sendMessage({
        type: 'START_GENERATION_JOB',
        payload: { jobId: job.id },
      });
      console.log('[CoverLetterWorkflow] Background response:', response);

      setLoading(false);
      setError(null);
      
      // Call the callback to notify parent component
      if (onGenerationStarted) {
        onGenerationStarted();
      }
    } catch (err) {
      console.error('[CoverLetterWorkflow] Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGenerate();
  };

  const isLinkedInJobPage = currentUrl.includes('linkedin.com/jobs');
  const canGenerate = profile !== null && jobDetails !== null && providerConfig !== null;

  return (
    <div className="cover-letter-generation">
      <div className="generation-start">
        {/* Job Details Section - Always Visible */}
        <div className="job-section">
          <div className="section-header">
            <h2>Job Details</h2>
            {isExtracting && (
              <span className="extraction-status">
                Extracting from page...
              </span>
            )}
          </div>

          {!isLinkedInJobPage && !jobDetails && (
            <div className="info-message">
              <p>Navigate to a job posting to auto-extract details, or enter them manually below.</p>
            </div>
          )}

          {extractionError && (
            <div className="error-message">
              <strong>Extraction Error</strong>
              <p>{extractionError}</p>
            </div>
          )}

          <JobDetailsForm jobDetails={jobDetails} onUpdate={handleJobUpdate} />
        </div>

        {/* Generation Section */}
        <div className="generation-section">
          <h2>Generate Cover Letter</h2>
          
          <div className="info-message">
            <p>💡 <strong>Background Generation:</strong> Your cover letter will be generated in the background. Check the <strong>Jobs</strong> tab to track progress and view results.</p>
          </div>
          
          {!canGenerate && (
            <div className="validation-warning">
              <p>
                {!profile && 'Please create a profile first. '}
                {!jobDetails && 'Please fill in job details above. '}
                {!providerConfig && 'Please configure your LLM provider in Settings first.'}
              </p>
            </div>
          )}

          {/* Custom Instructions Form */}
          <GenerationInstructionsForm
            onSubmit={handleInstructionsUpdate}
            disabled={!canGenerate || loading}
          />

          <GenerationButton
            onClick={handleGenerate}
            onRetry={error ? handleRetry : undefined}
            loading={loading}
            disabled={!canGenerate}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

// Backward compatibility export
export const CoverLetterGenerationMerged = CoverLetterWorkflow;
