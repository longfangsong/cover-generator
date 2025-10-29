import React, { useState, useEffect } from 'react';
import { JobDetails } from '../../models/JobDetails';
import './JobDetailsDisplay.css';

interface JobDetailsDisplayProps {
  jobDetails: JobDetails;
  onUpdate: (updated: JobDetails) => void;
}

/**
 * Display extracted job details with inline editing
 * Allows users to correct any extraction errors
 */
export const JobDetailsDisplay: React.FC<JobDetailsDisplayProps> = ({ jobDetails, onUpdate }) => {
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  const [editedCompany, setEditedCompany] = useState(jobDetails.company);
  const [editedTitle, setEditedTitle] = useState(jobDetails.title);
  const [editedDescription, setEditedDescription] = useState(jobDetails.description);
  const [editedSkills, setEditedSkills] = useState(jobDetails.skills.join(', '));

  // Sync local state with jobDetails prop when the actual values change
  // Only update if not currently editing to avoid overwriting user's in-progress edits
  useEffect(() => {
    if (!isEditingCompany) {
      setEditedCompany(jobDetails.company);
    }
  }, [jobDetails.company, isEditingCompany]);

  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(jobDetails.title);
    }
  }, [jobDetails.title, isEditingTitle]);

  useEffect(() => {
    if (!isEditingDescription) {
      setEditedDescription(jobDetails.description);
    }
  }, [jobDetails.description, isEditingDescription]);

  useEffect(() => {
    if (!isEditingSkills) {
      setEditedSkills(jobDetails.skills.join(', '));
    }
  }, [jobDetails.skills, isEditingSkills]);

  const handleCompanySave = () => {
    onUpdate({ ...jobDetails, company: editedCompany });
    setIsEditingCompany(false);
  };

  const handleTitleSave = () => {
    onUpdate({ ...jobDetails, title: editedTitle });
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    onUpdate({ ...jobDetails, description: editedDescription });
    setIsEditingDescription(false);
  };

  const handleSkillsSave = () => {
    const skillsArray = editedSkills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    onUpdate({ ...jobDetails, skills: skillsArray });
    setIsEditingSkills(false);
  };

  return (
    <div className="job-details-display">
      <h3>Job Details</h3>
      
      <div className="job-field">
        <label>Company:</label>
        {isEditingCompany ? (
          <div className="edit-field">
            <input
              type="text"
              value={editedCompany}
              onChange={e => setEditedCompany(e.target.value)}
              maxLength={200}
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleCompanySave} className="btn-save">Save</button>
              <button
                onClick={() => {
                  setEditedCompany(jobDetails.company);
                  setIsEditingCompany(false);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <span>{jobDetails.company}</span>
            <button onClick={() => setIsEditingCompany(true)} className="btn-edit">Edit</button>
          </div>
        )}
      </div>

      <div className="job-field">
        <label>Title:</label>
        {isEditingTitle ? (
          <div className="edit-field">
            <input
              type="text"
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              maxLength={200}
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleTitleSave} className="btn-save">Save</button>
              <button
                onClick={() => {
                  setEditedTitle(jobDetails.title);
                  setIsEditingTitle(false);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <span>{jobDetails.title}</span>
            <button onClick={() => setIsEditingTitle(true)} className="btn-edit">Edit</button>
          </div>
        )}
      </div>

      <div className="job-field">
        <label>Description:</label>
        {isEditingDescription ? (
          <div className="edit-field">
            <textarea
              value={editedDescription}
              onChange={e => setEditedDescription(e.target.value)}
              maxLength={10000}
              rows={8}
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleDescriptionSave} className="btn-save">Save</button>
              <button
                onClick={() => {
                  setEditedDescription(jobDetails.description);
                  setIsEditingDescription(false);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <p className="description-preview">
              {jobDetails.description.length > 200
                ? jobDetails.description.substring(0, 200) + '...'
                : jobDetails.description}
            </p>
            <button onClick={() => setIsEditingDescription(true)} className="btn-edit">Edit</button>
          </div>
        )}
      </div>

      <div className="job-field">
        <label>Skills:</label>
        {isEditingSkills ? (
          <div className="edit-field">
            <input
              type="text"
              value={editedSkills}
              onChange={e => setEditedSkills(e.target.value)}
              placeholder="Comma-separated skills"
              autoFocus
            />
            <small>Separate skills with commas</small>
            <div className="edit-actions">
              <button onClick={handleSkillsSave} className="btn-save">Save</button>
              <button
                onClick={() => {
                  setEditedSkills(jobDetails.skills.join(', '));
                  setIsEditingSkills(false);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <div className="skills-list">
              {jobDetails.skills.length > 0 ? (
                jobDetails.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="no-skills">No skills extracted</span>
              )}
            </div>
            <button onClick={() => setIsEditingSkills(true)} className="btn-edit">Edit</button>
          </div>
        )}
      </div>

      <div className="job-meta">
        <small>
          Platform: {jobDetails.platform} | Extracted: {jobDetails.extractedAt.toLocaleString()}
          {jobDetails.isManual && ' | Manually entered'}
        </small>
      </div>
    </div>
  );
};
