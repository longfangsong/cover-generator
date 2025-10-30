/**
 * EducationEntry Component
 * Individual education entry with all fields
 */

import React from 'react';
import { Education } from '../../../models/Education';

interface EducationEntryProps {
  education: Education;
  index: number;
  onChange: (updated: Education) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors: Record<string, string>;
}

export const EducationEntry: React.FC<EducationEntryProps> = ({
  education,
  index,
  onChange,
  onRemove,
  canRemove,
  errors,
}) => {
  const fieldPrefix = `education[${index}]`;

  const handleChange = (field: keyof Education, value: any) => {
    onChange({ ...education, [field]: value });
  };

  return (
    <div className="education-entry">
      <div className="entry-header">
        <h4>Education #{index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn-remove"
            aria-label="Remove education"
          >
            ✕
          </button>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`institution-${education.id}`}>
          Institution <span className="required">*</span>
        </label>
        <input
          id={`institution-${education.id}`}
          type="text"
          value={education.institution}
          onChange={(e) => handleChange('institution', e.target.value)}
          placeholder="University Name"
          required
          maxLength={200}
        />
        {errors[`${fieldPrefix}.institution`] && (
          <span className="error">{errors[`${fieldPrefix}.institution`]}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`degree-${education.id}`}>
          Degree <span className="required">*</span>
        </label>
        <input
          id={`degree-${education.id}`}
          type="text"
          value={education.degree}
          onChange={(e) => handleChange('degree', e.target.value)}
          placeholder="B.S. Computer Science"
          required
          maxLength={200}
        />
        {errors[`${fieldPrefix}.degree`] && (
          <span className="error">{errors[`${fieldPrefix}.degree`]}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`field-${education.id}`}>Field of Study</label>
        <input
          id={`field-${education.id}`}
          type="text"
          value={education.field || ''}
          onChange={(e) => handleChange('field', e.target.value || undefined)}
          placeholder="Computer Science"
          maxLength={200}
        />
        {errors[`${fieldPrefix}.field`] && (
          <span className="error">{errors[`${fieldPrefix}.field`]}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`startDate-${education.id}`}>Start Date</label>
          <input
            id={`startDate-${education.id}`}
            type="date"
            value={
              education.startDate instanceof Date && !isNaN(education.startDate.getTime())
                ? education.startDate.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              if (!e.target.value) {
                handleChange('startDate', undefined);
                return;
              }
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                handleChange('startDate', date);
              }
            }}
          />
          {errors[`${fieldPrefix}.startDate`] && (
            <span className="error">{errors[`${fieldPrefix}.startDate`]}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`endDate-${education.id}`}>End Date</label>
          <input
            id={`endDate-${education.id}`}
            type="date"
            value={
              education.endDate instanceof Date && !isNaN(education.endDate.getTime())
                ? education.endDate.toISOString().split('T')[0]
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
          <small className="hint">Leave empty if in progress</small>
          {errors[`${fieldPrefix}.endDate`] && (
            <span className="error">{errors[`${fieldPrefix}.endDate`]}</span>
          )}
        </div>
      </div>
    </div>
  );
};
