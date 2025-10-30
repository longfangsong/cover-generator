/**
 * CharacterCounter Component
 * Shows word/character limits with warnings
 */

import React from 'react';
import { countWords } from '../../../utils/formatters';

interface CharacterCounterProps {
  text: string;
  minWords?: number;
  maxWords?: number;
  minChars?: number;
  maxChars?: number;
  countType?: 'words' | 'chars';
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  text,
  minWords,
  maxWords,
  minChars,
  maxChars,
  countType = 'words',
}) => {
  const count = countType === 'words' ? countWords(text) : text.length;
  const min = countType === 'words' ? minWords : minChars;
  const max = countType === 'words' ? maxWords : maxChars;
  const unit = countType === 'words' ? 'word' : 'character';
  const pluralUnit = count === 1 ? unit : `${unit}s`;

  const getStatus = (): 'ok' | 'warning' | 'error' => {
    if (min && count < min) return 'warning';
    if (max && count > max) return 'error';
    return 'ok';
  };

  const status = getStatus();

  const getMessage = (): string => {
    if (min && max) {
      return `${count} / ${max} ${pluralUnit}`;
    } else if (max) {
      return `${count} / ${max} ${pluralUnit}`;
    } else if (min) {
      return `${count} ${pluralUnit} (min: ${min})`;
    }
    return `${count} ${pluralUnit}`;
  };

  return (
    <div className={`character-counter ${status}`}>
      <span className="counter-text">{getMessage()}</span>
      {status === 'warning' && min && count < min && (
        <span className="counter-hint">
          {min - count} more {unit}
          {min - count > 1 ? 's' : ''} needed
        </span>
      )}
      {status === 'error' && max && count > max && (
        <span className="counter-hint error">
          {count - max} {unit}
          {count - max > 1 ? 's' : ''} over limit
        </span>
      )}
    </div>
  );
};
