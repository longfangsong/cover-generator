/**
 * LoadingSkeleton Component
 * Displays loading placeholder for better perceived performance
 */

import React from 'react';
import './LoadingSkeleton.css';

interface LoadingSkeletonProps {
  type?: 'form' | 'content' | 'list';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'content' }) => {
  if (type === 'form') {
    return (
      <div className="loading-skeleton">
        <div className="skeleton-header" />
        <div className="skeleton-field">
          <div className="skeleton-label" />
          <div className="skeleton-input" />
        </div>
        <div className="skeleton-field">
          <div className="skeleton-label" />
          <div className="skeleton-input" />
        </div>
        <div className="skeleton-field">
          <div className="skeleton-label" />
          <div className="skeleton-textarea" />
        </div>
        <div className="skeleton-button" />
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="loading-skeleton">
        <div className="skeleton-header" />
        <div className="skeleton-list-item" />
        <div className="skeleton-list-item" />
        <div className="skeleton-list-item" />
      </div>
    );
  }

  return (
    <div className="loading-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-text" />
      <div className="skeleton-text" />
      <div className="skeleton-text short" />
    </div>
  );
};
