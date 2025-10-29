import React from 'react';
import { CoverLetterContent } from '../../models/CoverLetterContent';
import './CoverLetterPreview.css';

interface CoverLetterPreviewProps {
  content: CoverLetterContent;
  userProfile?: {
    name: string;
    email?: string;
    phone?: string;
  };
  jobDetails?: {
    company: string;
    position: string;
  };
}

/**
 * Renders a formatted, professional preview of the cover letter
 * suitable for copying or PDF export
 */
export const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({
  content,
  userProfile,
  jobDetails,
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="cover-letter-preview">
      {/* Header with user contact info */}
      {userProfile && (
        <div className="preview-header">
          <div className="contact-info">
            <h3 className="user-name">{userProfile.name}</h3>
            {userProfile.email && <p className="contact-detail">{userProfile.email}</p>}
            {userProfile.phone && <p className="contact-detail">{userProfile.phone}</p>}
          </div>
          <p className="date">{formatDate(new Date())}</p>
        </div>
      )}

      {/* Recipient info */}
      {jobDetails && (
        <div className="preview-recipient">
          <p className="recipient-line">Hiring Manager</p>
          <p className="recipient-line">{jobDetails.company}</p>
          <p className="recipient-line">{jobDetails.position}</p>
        </div>
      )}

      {/* Salutation */}
      <div className="preview-section">
        <p className="salutation">Dear Hiring Manager,</p>
      </div>

      {/* Opening paragraph */}
      {content.opening && (
        <div className="preview-section">
          <p className="paragraph">{content.opening}</p>
        </div>
      )}

      {/* About me section */}
      {content.aboutMe && (
        <div className="preview-section">
          <p className="paragraph">{content.aboutMe}</p>
        </div>
      )}

      {/* Why me section */}
      {content.whyMe && (
        <div className="preview-section">
          <p className="paragraph">{content.whyMe}</p>
        </div>
      )}

      {/* Why company section */}
      {content.whyCompany && (
        <div className="preview-section">
          <p className="paragraph">{content.whyCompany}</p>
        </div>
      )}

      {/* Closing */}
      <div className="preview-section preview-closing">
        <p className="paragraph">
          Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.
        </p>
        <p className="closing-salutation">Sincerely,</p>
        {userProfile && <p className="signature">{userProfile.name}</p>}
      </div>

      {/* Metadata footer (not printed) */}
      <div className="preview-metadata">
        <p className="metadata-item">Generated: {formatDate(content.generatedAt)}</p>
        {content.editedAt && (
          <p className="metadata-item">Last edited: {formatDate(content.editedAt)}</p>
        )}
      </div>
    </div>
  );
};
