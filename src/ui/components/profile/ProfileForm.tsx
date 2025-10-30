/**
 * ProfileForm Component
 * Main form for creating and editing user profile with all fields
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../models/UserProfile';
import { Experience } from '../../../models/Experience';
import { Project } from '../../../models/Project';
import { Education } from '../../../models/Education';
import { ExperienceEntry } from './ExperienceEntry';
import { ProjectEntry } from './ProjectEntry';
import { EducationEntry } from './EducationEntry';
import { SkillsInput } from './SkillsInput';
import { PDFUpload } from './PDFUpload';
import './ProfileForm.css';
import { validateProfile } from '../../../models/validation/ProfileValidator';

interface ProfileFormProps {
  initialProfile?: UserProfile | null;
  onSave: (profile: UserProfile) => Promise<void>;
  onCancel?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialProfile,
  onSave,
  onCancel,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homepage, setHomepage] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Load initial profile data
  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setEmail(initialProfile.email);
      setPhone(initialProfile.phone || '');
      setHomepage(initialProfile.homepage || '');
      setGithub(initialProfile.github || '');
      setLinkedin(initialProfile.linkedin || '');
      setExperience(initialProfile.experience);
      setProjects(initialProfile.projects || []);
      setEducation(initialProfile.education);
      setSkills(initialProfile.skills);
    }
  }, [initialProfile]);

  const createEmptyExperience = (): Experience => ({
    id: crypto.randomUUID(),
    role: '',
    startDate: new Date(),
    description: '',
  });

  const createEmptyProject = (): Project => ({
    id: crypto.randomUUID(),
    name: '',
    startDate: new Date(),
    description: '',
  });

  const createEmptyEducation = (): Education => ({
    id: crypto.randomUUID(),
    institution: '',
    degree: '',
  });

  const handleAddExperience = () => {
    setExperience([...experience, createEmptyExperience()]);
  };

  const handleRemoveExperience = (id: string) => {
    setExperience(experience.filter((exp) => exp.id !== id));
  };

  const handleUpdateExperience = (id: string, updated: Experience) => {
    setExperience(
      experience.map((exp) => (exp.id === id ? updated : exp))
    );
  };

  const handleAddProject = () => {
    setProjects([...projects, createEmptyProject()]);
  };

  const handleRemoveProject = (id: string) => {
    setProjects(projects.filter((proj) => proj.id !== id));
  };

  const handleUpdateProject = (id: string, updated: Project) => {
    setProjects(
      projects.map((proj) => (proj.id === id ? updated : proj))
    );
  };

  const handleAddEducation = () => {
    setEducation([...education, createEmptyEducation()]);
  };

  const handleRemoveEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  const handleUpdateEducation = (id: string, updated: Education) => {
    setEducation(
      education.map((edu) => (edu.id === id ? updated : edu))
    );
  };

  const handleProfileExtracted = (extractedProfile: Partial<UserProfile>) => {
    // Auto-populate form fields with extracted data
    if (extractedProfile.name) setName(extractedProfile.name);
    if (extractedProfile.email) setEmail(extractedProfile.email);
    if (extractedProfile.phone) setPhone(extractedProfile.phone);
    if (extractedProfile.homepage) setHomepage(extractedProfile.homepage);
    if (extractedProfile.github) setGithub(extractedProfile.github);
    if (extractedProfile.linkedin) setLinkedin(extractedProfile.linkedin);
    if (extractedProfile.experience && extractedProfile.experience.length > 0) {
      setExperience(extractedProfile.experience);
    }
    if (extractedProfile.projects && extractedProfile.projects.length > 0) {
      setProjects(extractedProfile.projects);
    }
    if (extractedProfile.education && extractedProfile.education.length > 0) {
      setEducation(extractedProfile.education);
    }
    if (extractedProfile.skills && extractedProfile.skills.length > 0) {
      setSkills(extractedProfile.skills);
    }
    
    // Clear any previous upload errors
    setUploadError('');
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const profile: UserProfile = {
      id: initialProfile?.id || crypto.randomUUID(),
      name,
      email,
      phone: phone || undefined,
      homepage: homepage || undefined,
      github: github || undefined,
      linkedin: linkedin || undefined,
      experience,
      projects,
      education,
      skills,
      createdAt: initialProfile?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Validate profile
    const validation = validateProfile(profile);
    if (!validation.valid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(profile);
    } catch (error) {
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <h2>Profile Information</h2>

      {/* PDF Upload Section */}
      <section className="form-section">
        <h3>Quick Start</h3>
        <p className="section-description">
          Upload your resume PDF to automatically fill in your profile information
        </p>
        <PDFUpload 
          onProfileExtracted={handleProfileExtracted}
          onError={handleUploadError}
        />
        {uploadError && (
          <div className="error-message">{uploadError}</div>
        )}
      </section>

      {/* Basic Information */}
      <section className="form-section">
        <h3>Basic Information</h3>

        <div className="form-group">
          <label htmlFor="name">
            Full Name <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            maxLength={200}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1234567890"
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="homepage">Homepage / Portfolio</label>
          <input
            id="homepage"
            type="url"
            value={homepage}
            onChange={(e) => setHomepage(e.target.value)}
            placeholder="https://yourwebsite.com"
          />
          {errors.homepage && <span className="error">{errors.homepage}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="github">GitHub</label>
          <input
            id="github"
            type="text"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://github.com/username or username"
          />
          {errors.github && <span className="error">{errors.github}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="linkedin">LinkedIn</label>
          <input
            id="linkedin"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/username"
          />
          {errors.linkedin && <span className="error">{errors.linkedin}</span>}
        </div>
      </section>

      {/* Skills */}
      <section className="form-section">
        <h3>
          Skills <span className="required">*</span>
        </h3>
        <SkillsInput value={skills} onChange={setSkills} />
        {errors.skills && <span className="error">{errors.skills}</span>}
      </section>

      {/* Work Experience */}
      <section className="form-section">
        <h3>Work Experience</h3>
        <p className="section-description">
          Add your professional work history with companies/organizations
        </p>
        {experience.length === 0 && (
          <p className="hint">No work experience added yet</p>
        )}
        {experience.map((exp, index) => (
          <ExperienceEntry
            key={exp.id}
            experience={exp}
            index={index}
            onChange={(updated: Experience) => handleUpdateExperience(exp.id, updated)}
            onRemove={() => handleRemoveExperience(exp.id)}
            canRemove={true}
            errors={errors}
          />
        ))}
        <button
          type="button"
          onClick={handleAddExperience}
          className="btn-secondary"
          disabled={experience.length + projects.length >= 15}
        >
          + Add Work Experience
        </button>
        {(experience.length + projects.length >= 15) && (
          <span className="warning">Maximum 15 combined experience and project entries reached</span>
        )}
      </section>

      {/* Projects */}
      <section className="form-section">
        <h3>Projects</h3>
        <p className="section-description">
          Add your personal projects, open source contributions, or side work
        </p>
        {projects.length === 0 && (
          <p className="hint">No projects added yet</p>
        )}
        {projects.map((proj, index) => (
          <ProjectEntry
            key={proj.id}
            project={proj}
            index={index}
            onChange={(updated: Project) => handleUpdateProject(proj.id, updated)}
            onRemove={() => handleRemoveProject(proj.id)}
            canRemove={true}
            errors={errors}
          />
        ))}
        <button
          type="button"
          onClick={handleAddProject}
          className="btn-secondary"
          disabled={experience.length + projects.length >= 15}
        >
          + Add Project
        </button>
        {(experience.length + projects.length >= 15) && (
          <span className="warning">Maximum 15 combined experience and project entries reached</span>
        )}
        {(experience.length === 0 && projects.length === 0) && (
          <span className="error">At least one work experience or project entry is required</span>
        )}
      </section>

      {/* Education */}
      <section className="form-section">
        <h3>Education</h3>
        {education.map((edu, index) => (
          <EducationEntry
            key={edu.id}
            education={edu}
            index={index}
            onChange={(updated: Education) => handleUpdateEducation(edu.id, updated)}
            onRemove={() => handleRemoveEducation(edu.id)}
            canRemove={true}
            errors={errors}
          />
        ))}
        <button
          type="button"
          onClick={handleAddEducation}
          className="btn-secondary"
          disabled={education.length >= 10}
        >
          + Add Education
        </button>
        {education.length >= 10 && (
          <span className="warning">Maximum 10 education entries reached</span>
        )}
      </section>

      {/* Form Actions */}
      <div className="form-actions">
        {errors.submit && <span className="error">{errors.submit}</span>}
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
