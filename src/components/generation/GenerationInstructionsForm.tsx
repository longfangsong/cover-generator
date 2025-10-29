/**
 * GenerationInstructionsForm Component
 * Allows users to provide optional custom instructions for each cover letter section
 */

import React, { useState } from 'react';
import { SectionInstructions } from '../../services/coverLetterGeneration/prompt';
import './GenerationInstructionsForm.css';

interface GenerationInstructionsFormProps {
  onSubmit: (instructions: SectionInstructions) => void;
  disabled?: boolean;
}

export const GenerationInstructionsForm: React.FC<GenerationInstructionsFormProps> = ({
  onSubmit,
  disabled = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [instructions, setInstructions] = useState<SectionInstructions>({
    opening: '',
    aboutMe: '',
    whyMe: '',
    whyCompany: '',
  });

  const handleChange = (section: keyof SectionInstructions, value: string) => {
    setInstructions(prev => ({
      ...prev,
      [section]: value,
    }));
  };

  const handleSubmit = () => {
    // Only pass non-empty instructions
    const filtered: SectionInstructions = {};
    if (instructions.opening?.trim()) filtered.opening = instructions.opening.trim();
    if (instructions.aboutMe?.trim()) filtered.aboutMe = instructions.aboutMe.trim();
    if (instructions.whyMe?.trim()) filtered.whyMe = instructions.whyMe.trim();
    if (instructions.whyCompany?.trim()) filtered.whyCompany = instructions.whyCompany.trim();
    
    onSubmit(filtered);
  };

  const hasAnyInstructions = Object.values(instructions).some(val => val.trim().length > 0);

  return (
    <div className="generation-instructions-form">
      <div className="instructions-header">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="toggle-advanced"
          disabled={disabled}
        >
          <span className="toggle-icon">{showAdvanced ? '▼' : '▶'}</span>
          <span>Custom Instructions (Optional)</span>
        </button>
        {hasAnyInstructions && !showAdvanced && (
          <span className="instructions-indicator">✓ Custom instructions added</span>
        )}
      </div>

      {showAdvanced && (
        <div className="instructions-fields">
          <p className="instructions-help">
            Provide optional guidance to customize how the AI generates each section.
            Leave blank to use default generation.
          </p>

          <div className="instruction-field">
            <label htmlFor="opening-instruction">
              Opening Section
              <span className="char-count">{instructions.opening?.length || 0}/500</span>
            </label>
            <textarea
              id="opening-instruction"
              value={instructions.opening}
              onChange={(e) => handleChange('opening', e.target.value)}
              placeholder="e.g., Keep it brief and mention how I found the position"
              maxLength={500}
              rows={2}
              disabled={disabled}
            />
          </div>

          <div className="instruction-field">
            <label htmlFor="aboutme-instruction">
              About Me Section
              <span className="char-count">{instructions.aboutMe?.length || 0}/500</span>
            </label>
            <textarea
              id="aboutme-instruction"
              value={instructions.aboutMe}
              onChange={(e) => handleChange('aboutMe', e.target.value)}
              placeholder="e.g., Focus on my educational background and recent graduation"
              maxLength={500}
              rows={2}
              disabled={disabled}
            />
          </div>

          <div className="instruction-field">
            <label htmlFor="whyme-instruction">
              Why Me Section
              <span className="char-count">{instructions.whyMe?.length || 0}/500</span>
            </label>
            <textarea
              id="whyme-instruction"
              value={instructions.whyMe}
              onChange={(e) => handleChange('whyMe', e.target.value)}
              placeholder="e.g., Emphasize my backend development and API design experience"
              maxLength={500}
              rows={2}
              disabled={disabled}
            />
          </div>

          <div className="instruction-field">
            <label htmlFor="whycompany-instruction">
              Why Company Section
              <span className="char-count">{instructions.whyCompany?.length || 0}/500</span>
            </label>
            <textarea
              id="whycompany-instruction"
              value={instructions.whyCompany}
              onChange={(e) => handleChange('whyCompany', e.target.value)}
              placeholder="e.g., Mention my admiration for their open source contributions"
              maxLength={500}
              rows={2}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};
