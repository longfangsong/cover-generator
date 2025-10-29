/**
 * ProjectEntry Component
 * Individual project entry (without company field)
 */

import React from 'react';
import { Project } from '../../models/Project';
import { CharacterCounter } from './CharacterCounter';
import { SkillsInput } from './SkillsInput';

interface ProjectEntryProps {
  project: Project;
  index: number;
  onChange: (updated: Project) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors: Record<string, string>;
}

export const ProjectEntry: React.FC<ProjectEntryProps> = ({
  project,
  index,
  onChange,
  onRemove,
  canRemove,
  errors,
}) => {
  const fieldPrefix = `projects[${index}]`;

  const handleChange = (field: keyof Project, value: any) => {
    onChange({ ...project, [field]: value });
  };

  return (
    <div className="experience-entry">
      <div className="entry-header">
        <h4>Project #{index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn-remove"
            aria-label="Remove project"
          >
            ✕
          </button>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`name-${project.id}`}>
          Project Name / Title <span className="required">*</span>
        </label>
        <input
          id={`name-${project.id}`}
          type="text"
          value={project.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Personal Website, Mobile App, etc."
          required
          maxLength={200}
        />
        {errors[`${fieldPrefix}.name`] && (
          <span className="error">{errors[`${fieldPrefix}.name`]}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`organization-${project.id}`}>
          Organization / Context (optional)
        </label>
        <input
          id={`organization-${project.id}`}
          type="text"
          value={project.organization || ''}
          onChange={(e) => handleChange('organization', e.target.value || undefined)}
          placeholder="University, Hackathon, Open Source, etc."
          maxLength={200}
        />
        {errors[`${fieldPrefix}.organization`] && (
          <span className="error">{errors[`${fieldPrefix}.organization`]}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`startDate-${project.id}`}>
            Start Date <span className="required">*</span>
          </label>
          <input
            id={`startDate-${project.id}`}
            type="date"
            value={
              project.startDate instanceof Date && !isNaN(project.startDate.getTime())
                ? project.startDate.toISOString().split('T')[0]
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
          <label htmlFor={`endDate-${project.id}`}>End Date</label>
          <input
            id={`endDate-${project.id}`}
            type="date"
            value={
              project.endDate instanceof Date && !isNaN(project.endDate.getTime())
                ? project.endDate.toISOString().split('T')[0]
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
          <small className="hint">Leave empty if ongoing</small>
          {errors[`${fieldPrefix}.endDate`] && (
            <span className="error">{errors[`${fieldPrefix}.endDate`]}</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`description-${project.id}`}>
          Description <span className="required">*</span>
        </label>
        <textarea
          id={`description-${project.id}`}
          value={project.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the project, your role, technologies used, and outcomes..."
          required
          rows={5}
        />
        <CharacterCounter
          text={project.description}
          minWords={10}
          maxWords={1000}
          countType="words"
        />
        {errors[`${fieldPrefix}.description`] && (
          <span className="error">{errors[`${fieldPrefix}.description`]}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`skills-${project.id}`}>Skills / Technologies Used</label>
        <SkillsInput
          value={project.skills || []}
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
