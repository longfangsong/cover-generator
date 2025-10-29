/**
 * GenerationJob model
 * Represents an async cover letter generation task
 */

import { UserProfile } from './UserProfile';
import { JobDetails } from './JobDetails';
import { CoverLetterContent } from './CoverLetterContent';
import { SectionInstructions } from '../services/coverLetterGeneration/prompt';

export enum GenerationJobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface GenerationJobConfig {
  instructions?: SectionInstructions;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerationJob {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Associated user profile ID */
  profileId: string;

  /** Associated job details ID */
  jobId: string;

  /** Job posting company name for display */
  company: string;

  /** Job position for display */
  position: string;

  /** Full user profile data (stored for background processing) */
  profile: UserProfile;

  /** Full job details data (stored for background processing) */
  jobDetails: JobDetails;

  /** Current status of the generation job */
  status: GenerationJobStatus;

  /** Configuration for generation */
  config: GenerationJobConfig;

  /** When the job was created */
  createdAt: Date;

  /** When the job started processing */
  startedAt?: Date;

  /** When the job completed (success or failure) */
  completedAt?: Date;

  /** Generated cover letter ID (if completed successfully) */
  coverLetterId?: string;

  /** Error message (if failed) */
  error?: string;

  /** Progress percentage (0-100) */
  progress?: number;

  /** Current step description */
  currentStep?: string;
}

/**
 * Create a new generation job
 */
export function createGenerationJob(
  profile: UserProfile,
  jobDetails: JobDetails,
  config: GenerationJobConfig
): GenerationJob {
  return {
    id: crypto.randomUUID(),
    profileId: profile.id,
    jobId: jobDetails.id,
    company: jobDetails.company,
    position: jobDetails.title,
    profile,
    jobDetails,
    status: GenerationJobStatus.PENDING,
    config,
    createdAt: new Date(),
    progress: 0,
  };
}

/**
 * Update job status and metadata
 */
export function updateJobStatus(
  job: GenerationJob,
  status: GenerationJobStatus,
  updates?: {
    error?: string;
    coverLetterId?: string;
    progress?: number;
    currentStep?: string;
  }
): GenerationJob {
  const now = new Date();
  
  return {
    ...job,
    status,
    ...(status === GenerationJobStatus.IN_PROGRESS && !job.startedAt && { startedAt: now }),
    ...(([GenerationJobStatus.COMPLETED, GenerationJobStatus.FAILED, GenerationJobStatus.CANCELLED].includes(status)) && { completedAt: now }),
    ...updates,
  };
}
