/**
 * GenerationJobsPanel Component
 * Displays all generation jobs (pending, in-progress, completed, failed)
 */

import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { GenerationJob, GenerationJobStatus, createGenerationJob } from '../../../models/GenerationJob';
import { BrowserStorageService } from '../../../infra/storage';
import { CoverLetterContent } from '../../../models/CoverLetterContent';
import { UserProfile } from '../../../models/UserProfile';
import { CoverLetterViewer } from './CoverLetterViewer';
import './GenerationJobsPanel.css';

const storageService = new BrowserStorageService();

interface GenerationJobsPanelProps {
  profileId: string | null;
  profile: UserProfile | null;
  refreshTrigger?: number; // Optional prop to trigger refresh
}

export const GenerationJobsPanel: React.FC<GenerationJobsPanelProps> = ({
  profileId,
  profile,
  refreshTrigger,
}) => {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingCoverLetter, setViewingCoverLetter] = useState<{
    coverLetter: CoverLetterContent;
    job: GenerationJob;
  } | null>(null);

  const loadJobs = async () => {
    if (!profileId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[GenerationJobsPanel] Loading jobs for profile:', profileId);
      const allJobs = await storageService.listGenerationJobs(profileId);
      console.log('[GenerationJobsPanel] Loaded jobs:', allJobs);
      setJobs(allJobs);
    } catch (err) {
      console.error('[GenerationJobsPanel] Failed to load generation jobs:', err);
      setError('Failed to load generation jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[GenerationJobsPanel] Effect triggered, profileId:', profileId, 'refreshTrigger:', refreshTrigger);
    loadJobs();

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      loadJobs();
    }, 2000);

    return () => clearInterval(interval);
  }, [profileId, refreshTrigger]);

  const handleViewCoverLetter = async (job: GenerationJob) => {
    if (!job.coverLetterId) return;

    try {
      const coverLetter = await storageService.loadCoverLetter(job.coverLetterId);
      if (coverLetter) {
        setViewingCoverLetter({ coverLetter, job });
      }
    } catch (err) {
      console.error('Failed to load cover letter:', err);
    }
  };

  const handleCloseCoverLetter = () => {
    setViewingCoverLetter(null);
  };

  const handleUpdateCoverLetter = async (updatedCoverLetter: CoverLetterContent) => {
    // Update in storage
    await storageService.saveCoverLetter(updatedCoverLetter);
    // Update local state
    if (viewingCoverLetter) {
      setViewingCoverLetter({
        ...viewingCoverLetter,
        coverLetter: updatedCoverLetter,
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await storageService.deleteGenerationJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleRetryJob = async (job: GenerationJob) => {
    try {
      // Create a new job with the same details but reset status
      const newJob = createGenerationJob(
        job.profile,
        job.jobDetails,
        job.config
      );

      console.log('[GenerationJobsPanel] Creating retry job:', newJob);
      await storageService.saveGenerationJob(newJob);

      // Delete the old failed job
      await storageService.deleteGenerationJob(job.id);

      // Send message to background script to start processing
      const response = await browser.runtime.sendMessage({
        type: 'START_GENERATION_JOB',
        payload: { jobId: newJob.id },
      });
      console.log('[GenerationJobsPanel] Background response:', response);

      // Reload jobs to show the new one
      await loadJobs();
    } catch (err) {
      console.error('Failed to retry job:', err);
    }
  };

  const getStatusIcon = (status: GenerationJobStatus) => {
    switch (status) {
      case GenerationJobStatus.PENDING:
        return '⏳';
      case GenerationJobStatus.IN_PROGRESS:
        return '⚙️';
      case GenerationJobStatus.COMPLETED:
        return '✅';
      case GenerationJobStatus.FAILED:
        return '❌';
      case GenerationJobStatus.CANCELLED:
        return '🚫';
      default:
        return '❓';
    }
  };

  const getStatusClass = (status: GenerationJobStatus) => {
    switch (status) {
      case GenerationJobStatus.PENDING:
        return 'status-pending';
      case GenerationJobStatus.IN_PROGRESS:
        return 'status-in-progress';
      case GenerationJobStatus.COMPLETED:
        return 'status-completed';
      case GenerationJobStatus.FAILED:
        return 'status-failed';
      case GenerationJobStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // If viewing a cover letter, show the viewer
  if (viewingCoverLetter) {
    return (
      <CoverLetterViewer
        coverLetter={viewingCoverLetter.coverLetter}
        profile={profile}
        jobDetails={viewingCoverLetter.job.jobDetails}
        onClose={handleCloseCoverLetter}
        onUpdate={handleUpdateCoverLetter}
      />
    );
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="generation-jobs-panel">
        <h3>Generation Jobs</h3>
        <div className="loading">Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="generation-jobs-panel">
        <h3>Generation Jobs</h3>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="generation-jobs-panel">
        <h3>Generation Jobs</h3>
        <div className="empty-state">
          <p>📋 No generation jobs yet.</p>
          <p className="hint">Go to the <strong>Generate</strong> tab and click "Generate Cover Letter" to create your first job. Jobs will appear here and run in the background.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="generation-jobs-panel">
      <div className="panel-header">
        <h3>Generation Jobs</h3>
        <button onClick={loadJobs} className="refresh-button" title="Refresh">
          🔄
        </button>
      </div>

      <div className="jobs-list">
        {jobs.map(job => (
          <div key={job.id} className={`job-item ${getStatusClass(job.status)}`}>
            <div className="job-header">
              <span className="status-icon">{getStatusIcon(job.status)}</span>
              <div className="job-info">
                <div className="job-title">{job.position}</div>
                <div className="job-company">{job.company}</div>
              </div>
              <div className="job-meta">
                <span className="job-time">{formatDate(job.createdAt)}</span>
              </div>
            </div>

            {job.status === GenerationJobStatus.IN_PROGRESS && (
              <div className="job-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${job.progress || 0}%` }}
                  />
                </div>
                {job.currentStep && (
                  <div className="progress-step">{job.currentStep}</div>
                )}
              </div>
            )}

            {job.status === GenerationJobStatus.FAILED && job.error && (
              <div className="job-error">
                <strong>Error:</strong> {job.error}
              </div>
            )}

            <div className="job-actions">
              {job.status === GenerationJobStatus.COMPLETED && job.coverLetterId && (
                <button 
                  onClick={() => handleViewCoverLetter(job)}
                  className="action-button view-button"
                >
                  View Cover Letter
                </button>
              )}
              
              {job.status === GenerationJobStatus.FAILED && (
                <button 
                  onClick={() => handleRetryJob(job)}
                  className="action-button retry-button"
                >
                  Retry
                </button>
              )}
              
              {(job.status === GenerationJobStatus.COMPLETED || 
                job.status === GenerationJobStatus.FAILED ||
                job.status === GenerationJobStatus.CANCELLED) && (
                <button 
                  onClick={() => handleDeleteJob(job.id)}
                  className="action-button delete-button"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
