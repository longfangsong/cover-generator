/**
 * CoverLetterViewer Component
 * Displays cover letter with edit and preview modes, plus export functionality
 */

import React, { useState } from 'react';
import { CoverLetterContent, CoverLetterState } from '../../../models/CoverLetterContent';
import { UserProfile } from '../../../models/UserProfile';
import { JobDetails } from '../../../models/JobDetails';
import { CoverLetterEditor } from './CoverLetterEditor';
import { CoverLetterPreview } from './CoverLetterPreview';
import { updateCoverLetterSection } from '../../../services/coverLetterGeneration';
import { createPDFExportService } from '../../../services/coverLetterGeneration/export';
import { GenerationError } from '../../../services/coverLetterGeneration/error';
import './CoverLetterViewer.css';

interface CoverLetterViewerProps {
  coverLetter: CoverLetterContent;
  profile: UserProfile | null;
  jobDetails: JobDetails | null;
  onClose: () => void;
  onUpdate?: (coverLetter: CoverLetterContent) => void;
}

export const CoverLetterViewer: React.FC<CoverLetterViewerProps> = ({
  coverLetter: initialCoverLetter,
  profile,
  jobDetails,
  onClose,
  onUpdate,
}) => {
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter);
  const [showPreview, setShowPreview] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const pdfService = createPDFExportService();

  const handleEdit = async (
    section: 'opening' | 'aboutMe' | 'whyMe' | 'whyCompany',
    content: string
  ) => {
    const updatedCoverLetter = {
      ...coverLetter,
      [section]: content,
      editedAt: new Date(),
      state: CoverLetterState.EDITED,
    };
    
    setCoverLetter(updatedCoverLetter);
    if (onUpdate) {
      onUpdate(updatedCoverLetter);
    }

    try {
      await updateCoverLetterSection(coverLetter.id, section, content, true);
    } catch (err) {
      console.error('[CoverLetterViewer] Failed to save edit:', err);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const formattedText = formatCoverLetterText(coverLetter, profile, jobDetails);
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('[CoverLetterViewer] Failed to copy:', err);
    }
  };

  const handleExportPDF = async () => {
    if (!profile || !jobDetails) return;

    setExportLoading(true);
    setExportError(null);

    const exportStartTime = performance.now();
    console.log('[CoverLetterViewer] 🚀 Starting PDF export at', new Date().toISOString());

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

      console.log('[CoverLetterViewer] 📄 Content sizes:', {
        opening: renderRequest.content.opening.length,
        aboutMe: renderRequest.content.aboutMe.length,
        whyMe: renderRequest.content.whyMe.length,
        whyCompany: renderRequest.content.whyCompany.length,
        total: Object.values(renderRequest.content).reduce((sum, text) => sum + text.length, 0),
      });

      const pdfStartTime = performance.now();
      console.log('[CoverLetterViewer] ⏱️ Calling PDF service...');
      
      const response = await pdfService.generatePDF(renderRequest);
      
      const pdfEndTime = performance.now();
      const pdfDuration = pdfEndTime - pdfStartTime;
      console.log('[CoverLetterViewer] ✅ PDF service returned in', pdfDuration.toFixed(2), 'ms');

      let filename = response.metadata?.suggestedFilename;
      if (!filename) {
        const date = new Date().toISOString().split('T')[0];
        const companyName = jobDetails.company.replace(/[^a-zA-Z0-9]/g, '_');
        filename = `CoverLetter_${companyName}_${date}`;
      }

      console.log('[CoverLetterViewer] 💾 Downloading PDF:', filename);
      const downloadStartTime = performance.now();
      
      pdfService.downloadPDF(response.pdfData!, filename);
      
      const downloadEndTime = performance.now();
      const downloadDuration = downloadEndTime - downloadStartTime;
      const totalDuration = downloadEndTime - exportStartTime;
      
      console.log('[CoverLetterViewer] ✅ Download triggered in', downloadDuration.toFixed(2), 'ms');
      console.log('[CoverLetterViewer] 🎉 TOTAL EXPORT TIME:', totalDuration.toFixed(2), 'ms');
      
      setExportLoading(false);
    } catch (err) {
      const errorTime = performance.now();
      const totalDuration = errorTime - exportStartTime;
      console.error('[CoverLetterViewer] ❌ Export failed after', totalDuration.toFixed(2), 'ms');
      console.error('[CoverLetterViewer] Error details:', err);

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

  return (
    <div className="cover-letter-viewer">
      <div className="viewer-header">
        <div className="viewer-title">
          <h3>Cover Letter</h3>
          {jobDetails && (
            <div className="job-info">
              <span className="position">{jobDetails.title}</span>
              {jobDetails.company && <span className="company"> at {jobDetails.company}</span>}
            </div>
          )}
        </div>
        <button onClick={onClose} className="close-button" title="Close">
          ✕
        </button>
      </div>

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

      <div className="viewer-content">
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
      </div>

      <div className="viewer-actions">
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
      </div>

      {exportError && (
        <div className="export-error">
          <p>{exportError}</p>
        </div>
      )}
    </div>
  );
};
