import React, { useState } from 'react';
import { JobDetails, JobPlatform } from '../../models/JobDetails';
import './JobDetailsForm.css';

interface JobDetailsFormProps {
  jobDetails: JobDetails | null;
  onUpdate: (updated: JobDetails) => void;
}

/**
 * Form for editing job details with inline editing
 * Allows users to correct any extraction errors or enter details manually
 */
export const JobDetailsForm: React.FC<JobDetailsFormProps> = ({ jobDetails, onUpdate }) => {
  const [company, setCompany] = useState(jobDetails?.company || '');
  const [title, setTitle] = useState(jobDetails?.title || '');
  const [description, setDescription] = useState(jobDetails?.description || '');
  const [skills, setSkills] = useState(jobDetails?.skills.join(', ') || '');

  const handleUpdate = () => {
    const skillsArray = skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const updated: JobDetails = {
      id: jobDetails?.id || crypto.randomUUID(),
      company,
      title,
      description,
      skills: skillsArray,
      url: jobDetails?.url || window.location.href,
      platform: jobDetails?.platform || JobPlatform.MANUAL,
      extractedAt: jobDetails?.extractedAt || new Date(),
      isManual: !jobDetails || jobDetails.isManual,
    };

    onUpdate(updated);
  };

  // Update local state when jobDetails prop changes (after extraction)
  React.useEffect(() => {
    if (jobDetails) {
      setCompany(jobDetails.company);
      setTitle(jobDetails.title);
      setDescription(jobDetails.description);
      setSkills(jobDetails.skills.join(', '));
    }
  }, [jobDetails]);

  return (
    <div className="job-details-form">
      <div className="form-group">
        <label htmlFor="company">Company *</label>
        <input
          id="company"
          type="text"
          value={company}
          onChange={e => {
            setCompany(e.target.value);
            handleUpdate();
          }}
          placeholder="e.g., Google"
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label htmlFor="title">Job Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            handleUpdate();
          }}
          placeholder="e.g., Senior Software Engineer"
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Job Description *</label>
        <textarea
          id="description"
          value={description}
          onChange={e => {
            setDescription(e.target.value);
            handleUpdate();
          }}
          placeholder="Paste or enter the job description here..."
          rows={8}
          maxLength={10000}
        />
        <small className="char-count">
          {description.length} / 10000 characters
        </small>
      </div>

      {jobDetails && !jobDetails.isManual && (
        <div className="extraction-info">
          <small>
            ✓ Extracted from {jobDetails.platform} on {jobDetails.extractedAt.toLocaleString()}
          </small>
        </div>
      )}
    </div>
  );
};
