/**
 * ExperienceEntry Component
 * Individual experience entry with all fields
 */

import React from 'react';
import { Experience } from '../../models/Experience';
import { CharacterCounter } from './CharacterCounter';
import { SkillsInput } from './SkillsInput';
import { formatDate } from '../../utils/formatters';

interface ExperienceEntryProps {
  experience: Experience;
  index: number;
  onChange: (updated: Experience) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors: Record<string, string>;
}

export const ExperienceEntry: React.FC<ExperienceEntryProps> = ({
  experience,
  index,
  onChange,
  onRemove,
  canRemove,
  errors,
}) => {
  const fieldPrefix = `experience[${index}]`;

  const handleChange = (field: keyof Experience, value: any) => {
    onChange({ ...experience, [field]: value });
  };

  return (
    <div className="experience-entry">
      <div className="entry-header">
        <h4>Experience #{index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn-remove"
            aria-label="Remove experience"
          >
            ✕
          </button>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`company-${experience.id}`}>
          Company/Organization (optional for projects)
        </label>
        <input
          id={`company-${experience.id}`}
          type="text"
          value={experience.company || ''}
          onChange={(e) => handleChange('company', e.target.value || undefined)}
          placeholder="Company or Organization Name"
          maxLength={200}
        />
        {errors[`${fieldPrefix}.company`] && (
          <span className="error">{errors[`${fieldPrefix}.company`]}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`role-${experience.id}`}>
          Role / Position <span className="required">*</span>
        </label>
        <input
          id={`role-${experience.id}`}
          type="text"
          value={experience.role}
          onChange={(e) => handleChange('role', e.target.value)}
          placeholder="Software Engineer"
          required
          maxLength={200}
        />
        {errors[`${fieldPrefix}.role`] && (
          <span className="error">{errors[`${fieldPrefix}.role`]}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`startDate-${experience.id}`}>
            Start Date <span className="required">*</span>
          </label>
          <input
            id={`startDate-${experience.id}`}
            type="date"
            value={
              experience.startDate instanceof Date && !isNaN(experience.startDate.getTime())
                ? experience.startDate.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              if (!e.target.value) return;
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                handleChange('startDate', date);
              }
            }}
            required
            max={new Date().toISOString().split('T')[0]}
          />
          {errors[`${fieldPrefix}.startDate`] && (
            <span className="error">{errors[`${fieldPrefix}.startDate`]}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`endDate-${experience.id}`}>End Date</label>
          <input
            id={`endDate-${experience.id}`}
            type="date"
            value={
              experience.endDate instanceof Date && !isNaN(experience.endDate.getTime())
                ? experience.endDate.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              if (!e.target.value) {
                handleChange('endDate', undefined);
                return;
              }
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                handleChange('endDate', date);
              }
            }}
          />
          <small className="hint">Leave empty if current position</small>
          {errors[`${fieldPrefix}.endDate`] && (
            <span className="error">{errors[`${fieldPrefix}.endDate`]}</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`description-${experience.id}`}>
          Description <span className="required">*</span>
        </label>
        <textarea
          id={`description-${experience.id}`}
          value={experience.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your responsibilities and achievements..."
          required
          rows={5}
        />
        <CharacterCounter
          text={experience.description}
          minWords={10}
          maxWords={1000}
          countType="words"
        />
        {errors[`${fieldPrefix}.description`] && (
          <span className="error">{errors[`${fieldPrefix}.description`]}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`skills-${experience.id}`}>Skills Used</label>
        <SkillsInput
          value={experience.skills || []}
          onChange={(skills) => handleChange('skills', skills.length > 0 ? skills : undefined)}
          maxSkills={20}
        />
        {errors[`${fieldPrefix}.skills`] && (
          <span className="error">{errors[`${fieldPrefix}.skills`]}</span>
        )}
      </div>
    </div>
  );
};
