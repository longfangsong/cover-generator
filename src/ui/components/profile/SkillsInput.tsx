/**
 * SkillsInput Component
 * Tag-based interface for managing skills (max 50)
 */

import React, { useState, KeyboardEvent } from 'react';
import { USER_PROFILE_CONSTRAINTS } from '../../../models/UserProfile';

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
}

export const SkillsInput: React.FC<SkillsInputProps> = ({ 
  value, 
  onChange,
  maxSkills = USER_PROFILE_CONSTRAINTS.SKILLS_MAX_COUNT 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last skill if backspace pressed on empty input
      removeSkill(value.length - 1);
    }
  };

  const addSkill = () => {
    const skill = inputValue.trim();
    if (!skill) return;

    // Check if already exists
    if (value.includes(skill)) {
      setInputValue('');
      return;
    }

    // Check max count
    if (value.length >= maxSkills) {
      return;
    }

    // Check skill length
    if (
      skill.length < USER_PROFILE_CONSTRAINTS.SKILL_MIN_LENGTH ||
      skill.length > USER_PROFILE_CONSTRAINTS.SKILL_MAX_LENGTH
    ) {
      return;
    }

    onChange([...value, skill]);
    setInputValue('');
  };

  const removeSkill = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleBlur = () => {
    // Add skill on blur if there's text
    if (inputValue.trim()) {
      addSkill();
    }
  };

  return (
    <div className="skills-input">
      <div className="skills-tags">
        {value.map((skill, index) => (
          <span key={index} className="skill-tag">
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="skill-remove"
              aria-label={`Remove ${skill}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={
            value.length === 0
              ? 'Type a skill and press Enter'
              : value.length >= maxSkills
              ? 'Maximum skills reached'
              : 'Add another skill'
          }
          disabled={value.length >= maxSkills}
          maxLength={USER_PROFILE_CONSTRAINTS.SKILL_MAX_LENGTH}
          className="skills-input-field"
        />
      </div>
      <div className="skills-count">
        {value.length} / {maxSkills} skills
        {value.length < USER_PROFILE_CONSTRAINTS.SKILLS_MIN_COUNT && (
          <span className="warning"> (at least 1 required)</span>
        )}
      </div>
      <small className="hint">
        Press Enter or comma to add a skill. Click ✕ to remove.
      </small>
    </div>
  );
};
