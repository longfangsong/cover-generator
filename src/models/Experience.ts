/**
 * Experience model
 * Represents a single work or project experience entry in the user's profile.
 */

export interface Experience {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Employer name (1-200 chars, optional for projects) */
  company?: string;

  /** Job title/position (1-200 chars) */
  role: string;

  /** Employment start date (ISO 8601, not future) */
  startDate: Date;

  /** Employment end date (ISO 8601, after startDate, null = current) */
  endDate?: Date;

  /** Responsibilities and achievements (10-1000 words) */
  description: string;

  /** Skills used in this role (Max 20) */
  skills?: string[];
}

/**
 * Validation constants for Experience
 */
export const EXPERIENCE_CONSTRAINTS = {
  COMPANY_MIN_LENGTH: 1,
  COMPANY_MAX_LENGTH: 200,
  ROLE_MIN_LENGTH: 1,
  ROLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_WORDS: 10,
  DESCRIPTION_MAX_WORDS: 1000,
  SKILLS_MAX_COUNT: 20,
} as const;
