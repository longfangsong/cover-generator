/**
 * GenerationJob model
 * Represents an async cover letter generation task
 */

import { UserProfile } from './userProfile';
import { JobDetails } from './jobDetails';
import { SectionInstructions } from '../services/coverLetterGeneration/prompt';

export enum Status {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Config {
  instructions?: SectionInstructions;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Task {
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
  status: Status;

  /** Configuration for generation */
  config: Config;

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
}

/**
 * Create a new generation job
 */
export function createTask(
  profile: UserProfile,
  jobDetails: JobDetails,
  config: Config
): Task {
  return {
    id: crypto.randomUUID(),
    profileId: profile.id,
    jobId: jobDetails.id,
    company: jobDetails.company,
    position: jobDetails.title,
    profile,
    jobDetails,
    status: Status.PENDING,
    config,
    createdAt: new Date(),
  };
}
