/**
 * CoverLetterGeneration Container
 * Integrates generation flow with UI components
 */

import React, { useState } from 'react';
import { UserProfile } from '../../../models/UserProfile';
import { JobDetails } from '../../../models/JobDetails';
import { CoverLetterContent, CoverLetterState, LLMProviderEnum } from '../../../models/CoverLetterContent';
import { LLMProviderConfig } from '../../../models/LLMProviderConfig';
import { GenerationButton } from './GenerationButton';
import { CoverLetterEditor } from './CoverLetterEditor';
import { CoverLetterPreview } from './CoverLetterPreview';
import { validateInputs, generateCoverLetter, updateCoverLetterSection } from '../../../services/coverLetterGeneration';
import { createPDFExportService } from '../../../services/coverLetterGeneration/export';
import { GenerationError } from '../../../services/coverLetterGeneration/error';
import { llmRegistry } from '../../../infra/llm';

interface CoverLetterGenerationProps {
  profile: UserProfile | null;
  jobDetails: JobDetails | null;
  providerConfig: LLMProviderConfig | null;
}

export const CoverLetterGeneration: React.FC<CoverLetterGenerationProps> = ({
  profile,
  jobDetails,
  providerConfig
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Initialize PDF service
  const pdfService = createPDFExportService();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check provider config
      if (!providerConfig) {
        setError('Please configure your LLM provider in Settings first');
        setLoading(false);
        return;
      }

      // Validate inputs
      const validation = await validateInputs(profile, jobDetails);
      if (!validation.valid) {
        setError(validation.error || 'Validation failed');
        setLoading(false);
        return;
      }

      // Get LLM provider from registry based on config
      const providerId = providerConfig.providerId === LLMProviderEnum.OLLAMA ? 'ollama' : 'gemini';
      const provider = llmRegistry.get(providerId);

      // Generate cover letter with model config
      const result = await generateCoverLetter(
        provider,
        profile!,
        jobDetails!,
        {
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
      console.error('[CoverLetterGeneration] Error:', err);
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

    // Update local state immediately
    setCoverLetter({
      ...coverLetter,
      [section]: content,
      editedAt: new Date(),
      state: CoverLetterState.EDITED,
    });

    // Save to storage in background
    try {
      await updateCoverLetterSection(coverLetter.id, section, content, true);
    } catch (err) {
      console.error('[CoverLetterGeneration] Failed to save edit:', err);
      // Could show a toast notification here
    }
  };

  const handleCopyToClipboard = async () => {
    if (!coverLetter) return;

    try {
      // Format the cover letter as plain text
      const formattedText = formatCoverLetterText(coverLetter, profile, jobDetails);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(formattedText);
      
      // Show success message
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('[CoverLetterGeneration] Failed to copy:', err);
      setError('Failed to copy to clipboard');
    }
  };

  const handleExportPDF = async () => {
    if (!coverLetter || !profile || !jobDetails) return;

    setExportLoading(true);
    setExportError(null);

    try {
      // Prepare render request
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

      // Generate PDF
      const response = await pdfService.generatePDF(renderRequest);

      // Use suggested filename from API if available, otherwise fall back to generated one
      let filename = response.metadata?.suggestedFilename;
      if (!filename) {
        const date = new Date().toISOString().split('T')[0];
        const companyName = jobDetails.company.replace(/[^a-zA-Z0-9]/g, '_');
        filename = `CoverLetter_${companyName}_${date}`;
      }

      // Download PDF
      pdfService.downloadPDF(response.pdfData!, filename);

      setExportLoading(false);
    } catch (err) {
      console.error('[CoverLetterGeneration] Export failed:', err);
      
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

    // Salutation
    parts.push('Dear Hiring Manager,');
    parts.push(''); // Blank line

    // Body paragraphs
    parts.push(content.opening);
    parts.push(''); // Blank line
    parts.push(content.aboutMe);
    parts.push(''); // Blank line
    parts.push(content.whyMe);
    parts.push(''); // Blank line
    parts.push(content.whyCompany);
    parts.push(''); // Blank line

    // Closing
    parts.push('Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.');
    parts.push(''); // Blank line
    parts.push('Sincerely,');
    if (profile) parts.push(profile.name);

    return parts.join('\n');
  };

  // Show validation errors if inputs are invalid
  const canGenerate = profile !== null && jobDetails !== null && providerConfig !== null;

  return (
    <div className="cover-letter-generation">
      {!coverLetter ? (
        <div className="generation-start">
          <h2>Generate Your Cover Letter</h2>
          {!canGenerate && (
            <div className="validation-warning">
              <p>
                {!profile && 'Please create a profile first. '}
                {!jobDetails && 'Please extract or enter job details first. '}
                {!providerConfig && 'Please configure your LLM provider in Settings first.'}
              </p>
            </div>
          )}
          <GenerationButton
            onClick={handleGenerate}
            onRetry={error ? handleRetry : undefined}
            loading={loading}
            disabled={!canGenerate}
            error={error}
          />
        </div>
      ) : (
        <div className="generation-result">
          {/* Toggle between edit and preview modes */}
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

          {/* Action buttons */}
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

          {/* Export error message */}
          {exportError && (
            <div className="export-error">
              <p>{exportError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
