/**
 * GenerationButton Component
 * Button to trigger cover letter generation with loading state
 */

import React from 'react';

interface GenerationButtonProps {
  onClick: () => void;
  onRetry?: () => void;
  loading: boolean;
  disabled?: boolean;
  error?: string | null;
}

export const GenerationButton: React.FC<GenerationButtonProps> = ({
  onClick,
  onRetry,
  loading,
  disabled,
  error
}) => {
  return (
    <div className="generation-button-container">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`generation-button ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}
      >
        {loading ? (
          <>
            <span className="loading-spinner"></span>
            Generating your cover letter...
          </>
        ) : (
          'Generate Cover Letter'
        )}
      </button>
      {error && (
        <div className="error-message">
          {error}
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              Retry Generation
            </button>
          )}
        </div>
      )}
    </div>
  );
};
