/**
 * CoverLetterEditor Component
 * Displays and allows editing of generated cover letter sections
 */

import React, { useState } from 'react';
import './CoverLetterEditor.css';

interface CoverLetterEditorProps {
  opening: string;
  aboutMe: string;
  whyMe: string;
  whyCompany: string;
  onEdit: (section: 'opening' | 'aboutMe' | 'whyMe' | 'whyCompany', content: string) => void;
}

export const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({
  opening,
  aboutMe,
  whyMe,
  whyCompany,
  onEdit
}) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleSectionClick = (section: 'opening' | 'aboutMe' | 'whyMe' | 'whyCompany') => {
    setEditingSection(section);
  };

  const handleSectionBlur = () => {
    setEditingSection(null);
  };

  const handleSectionChange = (
    section: 'opening' | 'aboutMe' | 'whyMe' | 'whyCompany',
    value: string
  ) => {
    onEdit(section, value);
  };

  const renderSection = (
    section: 'opening' | 'aboutMe' | 'whyMe' | 'whyCompany',
    title: string,
    content: string
  ) => {
    const isEditing = editingSection === section;

    return (
      <div className={`cover-letter-section ${isEditing ? 'editing' : ''}`}>
        <h3>{title}</h3>
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => handleSectionChange(section, e.target.value)}
            onBlur={handleSectionBlur}
            autoFocus
            rows={6}
            className="section-editor"
          />
        ) : (
          <div
            className="section-content"
            onClick={() => handleSectionClick(section)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSectionClick(section);
              }
            }}
          >
            {content}
            <span className="edit-hint">Click to edit</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="cover-letter-editor">
      <div className="editor-header">
        <h2>Your Cover Letter</h2>
        <p className="editor-instruction">Click any section to edit it</p>
      </div>

      {renderSection('opening', 'Opening', opening)}
      {renderSection('aboutMe', 'About Me', aboutMe)}
      {renderSection('whyMe', 'Why I am a Good Fit', whyMe)}
      {renderSection('whyCompany', 'Why This Company', whyCompany)}
    </div>
  );
};
