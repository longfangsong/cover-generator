/**
 * JobDetails model
 * Represents information extracted from a job posting.
 * Storage: Browser session storage (temporary) + cache in local storage for recent jobs
 */

/**
 * Supported job platforms for extraction
 */
export enum JobPlatform {
  LINKEDIN = 'LinkedIn',
  INDEED = 'Indeed',
  GLASSDOOR = 'Glassdoor',
  MANUAL = 'Manual', // Manually entered job details
}

export interface JobDetails {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Job posting URL (valid URL) */
  url: string;

  /** Company name (1-200 chars) */
  company: string;

  /** Job title/position (1-200 chars) */
  title: string;

  /** Full job description (10-10000 chars) */
  description: string;

  /** Extracted skills from job posting (optional) */
  skills: string[];

  /** Source platform */
  platform: JobPlatform;

  /** Timestamp when job details were extracted */
  extractedAt: Date;

  /** Whether this was manually entered (vs extracted from page) */
  isManual: boolean;
}

/**
 * Validation constants for JobDetails
 */
export const JOB_DETAILS_CONSTRAINTS = {
  COMPANY_MIN_LENGTH: 1,
  COMPANY_MAX_LENGTH: 200,
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 10000,
} as const;
