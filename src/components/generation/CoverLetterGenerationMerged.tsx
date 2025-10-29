/**
 * CoverLetterWorkflow Component
 * Integrates job extraction, generation instructions, and cover letter generation workflow
 */

import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { UserProfile } from '../../models/UserProfile';
import { JobDetails } from '../../models/JobDetails';
import { CoverLetterContent, CoverLetterState, LLMProviderEnum } from '../../models/CoverLetterContent';
import { LLMProviderConfig } from '../../models/LLMProviderConfig';
import { GenerationButton } from './GenerationButton';
import { CoverLetterEditor } from './CoverLetterEditor';
import { CoverLetterPreview } from './CoverLetterPreview';
import { JobDetailsForm } from './JobDetailsForm';
import { GenerationInstructionsForm } from './GenerationInstructionsForm';
import { GenerationJobsPanel } from './GenerationJobsPanel';
import { validateInputs, generateCoverLetter, updateCoverLetterSection } from '../../services/coverLetterGeneration';
import { SectionInstructions } from '../../services/coverLetterGeneration/prompt';
import { createPDFExportService } from '../../services/coverLetterGeneration/export';
import { GenerationError } from '../../services/coverLetterGeneration/error';
import { BrowserStorageService } from '../../infra/storage/BrowserStorageService';
import { llmRegistry } from '../../infra/llm';
import { createGenerationJob } from '../../models/GenerationJob';
import './JobExtraction.css';

const storageService = new BrowserStorageService();

interface CoverLetterWorkflowProps {
  profile: UserProfile | null;
  providerConfig: LLMProviderConfig | null;
  onJobExtracted?: (job: JobDetails) => void;
}

export const CoverLetterWorkflow: React.FC<CoverLetterWorkflowProps> = ({
  profile,
  providerConfig,
  onJobExtracted
}) => {
  // Job extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  // Generation instructions state
  const [instructions, setInstructions] = useState<SectionInstructions>({});
  const [useAsyncGeneration, setUseAsyncGeneration] = useState(true);
  const [jobsRefreshTrigger, setJobsRefreshTrigger] = useState(0);

  // Cover letter generation state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize PDF service
  const pdfService = createPDFExportService();

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

      if (useAsyncGeneration) {
        // Create and queue a background generation job
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

        // Trigger panel refresh
        setJobsRefreshTrigger(prev => prev + 1);

        // Send message to background script to start processing
        const response = await browser.runtime.sendMessage({
          type: 'START_GENERATION_JOB',
          payload: { jobId: job.id },
        });
        console.log('[CoverLetterWorkflow] Background response:', response);

        setLoading(false);
        setError(null);
        // Show a success message
        setSuccessMessage('Cover letter generation started in background. Check the Generation Jobs panel to track progress.');
        setTimeout(() => setSuccessMessage(null), 5000);
        return;
      }

      // Synchronous generation (original flow)
      const providerId = providerConfig.providerId === LLMProviderEnum.OLLAMA ? 'ollama' : 'gemini';
      const provider = llmRegistry.get(providerId);

      const result = await generateCoverLetter(
        provider,
        profile!,
        jobDetails!,
        {
          instructions: Object.keys(instructions).length > 0 ? instructions : undefined,
          saveToStorage: true,
          model: providerConfig.model,
          temperature: providerConfig.temperature,
          maxTokens: providerConfig.maxTokens,
        }
      );

      if (!result.success) {
        setError(result.error || 'Generation failed');
        setLoading(false);
        return;
      }

      setCoverLetter(result.content!);
      setLoading(false);
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

  const handleEdit = async (
    section: 'opening' | 'aboutMe' | 'whyMe' | 'whyCompany',
    content: string
  ) => {
    if (!coverLetter) return;

    setCoverLetter({
      ...coverLetter,
      [section]: content,
      editedAt: new Date(),
      state: CoverLetterState.EDITED,
    });

    try {
      await updateCoverLetterSection(coverLetter.id, section, content, true);
    } catch (err) {
      console.error('[CoverLetterWorkflow] Failed to save edit:', err);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!coverLetter) return;

    try {
      const formattedText = formatCoverLetterText(coverLetter, profile, jobDetails);
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('[CoverLetterWorkflow] Failed to copy:', err);
      setError('Failed to copy to clipboard');
    }
  };

  const handleExportPDF = async () => {
    if (!coverLetter || !profile || !jobDetails) return;

    setExportLoading(true);
    setExportError(null);

    const exportStartTime = performance.now();
    console.log('[CoverLetterWorkflow] 🚀 Starting PDF export at', new Date().toISOString());

    try {
      const renderRequest = {
        content: {
          addressee: coverLetter.addressee,
          opening: coverLetter.opening,
          aboutMe: coverLetter.aboutMe,
          whyMe: coverLetter.whyMe,
          whyCompany: coverLetter.whyCompany,
        },
        userProfile: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        },
        jobDetails: {
          company: jobDetails.company,
          position: jobDetails.title,
        },
      };

      console.log('[CoverLetterWorkflow] 📄 Content sizes:', {
        opening: renderRequest.content.opening.length,
        aboutMe: renderRequest.content.aboutMe.length,
        whyMe: renderRequest.content.whyMe.length,
        whyCompany: renderRequest.content.whyCompany.length,
        total: Object.values(renderRequest.content).reduce((sum, text) => sum + text.length, 0),
      });

      const pdfStartTime = performance.now();
      console.log('[CoverLetterWorkflow] ⏱️ Calling PDF service...');
      
      const response = await pdfService.generatePDF(renderRequest);
      
      const pdfEndTime = performance.now();
      const pdfDuration = pdfEndTime - pdfStartTime;
      console.log('[CoverLetterWorkflow] ✅ PDF service returned in', pdfDuration.toFixed(2), 'ms');

      let filename = response.metadata?.suggestedFilename;
      if (!filename) {
        const date = new Date().toISOString().split('T')[0];
        const companyName = jobDetails.company.replace(/[^a-zA-Z0-9]/g, '_');
        filename = `CoverLetter_${companyName}_${date}`;
      }

      console.log('[CoverLetterWorkflow] 💾 Downloading PDF:', filename);
      const downloadStartTime = performance.now();
      
      pdfService.downloadPDF(response.pdfData!, filename);
      
      const downloadEndTime = performance.now();
      const downloadDuration = downloadEndTime - downloadStartTime;
      const totalDuration = downloadEndTime - exportStartTime;
      
      console.log('[CoverLetterWorkflow] ✅ Download triggered in', downloadDuration.toFixed(2), 'ms');
      console.log('[CoverLetterWorkflow] 🎉 TOTAL EXPORT TIME:', totalDuration.toFixed(2), 'ms');
      console.log('[CoverLetterWorkflow] 📊 Performance breakdown:', {
        preparation: `${(pdfStartTime - exportStartTime).toFixed(2)}ms`,
        pdfGeneration: `${pdfDuration.toFixed(2)}ms (${((pdfDuration / totalDuration) * 100).toFixed(1)}%)`,
        download: `${downloadDuration.toFixed(2)}ms`,
      });
      
      setExportLoading(false);
    } catch (err) {
      const errorTime = performance.now();
      const totalDuration = errorTime - exportStartTime;
      console.error('[CoverLetterWorkflow] ❌ Export failed after', totalDuration.toFixed(2), 'ms');
      console.error('[CoverLetterWorkflow] Error details:', err);

      if (err instanceof GenerationError) {
        setExportError('PDF export failed. Please copy text manually.');
      } else {
        setExportError('An unexpected error occurred during export.');
      }

      setExportLoading(false);
    }
  };

  const formatCoverLetterText = (
    content: CoverLetterContent,
    profile: UserProfile | null,
    jobDetails: JobDetails | null
  ): string => {
    const parts: string[] = [];
    parts.push('Dear Hiring Manager,');
    parts.push('');
    parts.push(content.opening);
    parts.push('');
    parts.push(content.aboutMe);
    parts.push('');
    parts.push(content.whyMe);
    parts.push('');
    parts.push(content.whyCompany);
    parts.push('');
    parts.push('Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.');
    parts.push('');
    parts.push('Sincerely,');
    if (profile) parts.push(profile.name);
    return parts.join('\n');
  };

  const isLinkedInJobPage = currentUrl.includes('linkedin.com/jobs');
  const canGenerate = profile !== null && jobDetails !== null && providerConfig !== null;

  const handleViewCoverLetter = async (coverLetter: CoverLetterContent) => {
    console.log('[CoverLetterWorkflow] Viewing cover letter:', coverLetter.id);
    setCoverLetter(coverLetter);
    setShowPreview(true);

    // Load the associated job details from the generation job
    try {
      const jobs = await storageService.listGenerationJobs(profile?.id);
      const job = jobs.find(j => j.coverLetterId === coverLetter.id);

      if (job && job.jobDetails) {
        console.log('[CoverLetterWorkflow] Found associated job details:', job.jobDetails);
        setJobDetails(job.jobDetails);
      } else {
        console.warn('[CoverLetterWorkflow] No job details found for cover letter, using minimal data');
        // Fallback: create minimal job details from cover letter data
        const { JobPlatform } = await import('../../models/JobDetails');
        setJobDetails({
          id: coverLetter.jobId,
          url: '',
          title: coverLetter.position,
          company: '', // We don't have this in cover letter, will be empty
          description: '',
          skills: [],
          platform: JobPlatform.MANUAL,
          extractedAt: coverLetter.generatedAt,
          isManual: true,
        });
      }
    } catch (err) {
      console.error('[CoverLetterWorkflow] Failed to load job details:', err);
    }
  };

  return (
    <div className="cover-letter-generation">
      {/* Generation Jobs Panel */}
      {profile && (
        <GenerationJobsPanel
          profileId={profile.id}
          onViewCoverLetter={handleViewCoverLetter}
          refreshTrigger={jobsRefreshTrigger}
        />
      )}

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
        {!coverLetter ? (
          <div className="generation-section">
            <h2>Generate Cover Letter</h2>
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

            {/* Async Generation Toggle */}
            <div className="generation-mode">
              <label>
                <input
                  type="checkbox"
                  checked={useAsyncGeneration}
                  onChange={(e) => setUseAsyncGeneration(e.target.checked)}
                />
                Generate in background (asynchronous)
              </label>
              <p className="mode-hint">
                {useAsyncGeneration
                  ? 'Generation will run in the background. You can track progress in the Jobs panel above.'
                  : 'Generation will run immediately and block until complete.'}
              </p>
            </div>

            <GenerationButton
              onClick={handleGenerate}
              onRetry={error ? handleRetry : undefined}
              loading={loading}
              disabled={!canGenerate}
              error={error}
            />

            {/* Success Notification */}
            {successMessage && (
              <div className="success-notification">
                <span>✓ {successMessage}</span>
                <button onClick={() => setSuccessMessage(null)} className="close-button">×</button>
              </div>
            )}
          </div>
        ) : (
          <div className="generation-result">
            <div className="view-toggle">
              <button
                onClick={() => setShowPreview(false)}
                className={`toggle-button ${!showPreview ? 'active' : ''}`}
              >
                Edit
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`toggle-button ${showPreview ? 'active' : ''}`}
              >
                Preview
              </button>
            </div>

            {showPreview ? (
              <CoverLetterPreview
                content={coverLetter}
                userProfile={profile ? {
                  name: profile.name,
                  email: profile.email,
                  phone: profile.phone,
                } : undefined}
                jobDetails={jobDetails ? {
                  company: jobDetails.company,
                  position: jobDetails.title,
                } : undefined}
              />
            ) : (
              <CoverLetterEditor
                opening={coverLetter.opening}
                aboutMe={coverLetter.aboutMe}
                whyMe={coverLetter.whyMe}
                whyCompany={coverLetter.whyCompany}
                onEdit={handleEdit}
              />
            )}

            <div className="generation-actions">
              <button
                onClick={handleCopyToClipboard}
                className="button secondary"
                disabled={exportLoading}
              >
                {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>

              <button
                onClick={handleExportPDF}
                className="button primary"
                disabled={exportLoading}
              >
                {exportLoading ? 'Exporting...' : 'Export to PDF'}
              </button>

              <button
                onClick={handleGenerate}
                className="button secondary"
                disabled={exportLoading}
              >
                Regenerate
              </button>
            </div>

            {exportError && (
              <div className="export-error">
                <p>{exportError}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Backward compatibility export
export const CoverLetterGenerationMerged = CoverLetterWorkflow;
