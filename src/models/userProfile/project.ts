/**
 * Project model
 * Represents a personal project entry in the user's profile.
 */

export interface Project {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Project name/title (1-200 chars) */
  name: string;

  /** Organization/context (1-200 chars, optional) */
  organization?: string;

  /** Project start date (ISO 8601, not future) */
  startDate: Date;

  /** Project end date (ISO 8601, after startDate, null = ongoing) */
  endDate?: Date;

  /** Project description and achievements (10-1000 words) */
  description: string;

  /** Technologies/skills used in this project (Max 20) */
  skills?: string[];
}

/**
 * Validation constants for Project
 */
export const PROJECT_CONSTRAINTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 200,
  ORGANIZATION_MIN_LENGTH: 1,
  ORGANIZATION_MAX_LENGTH: 200,
  DESCRIPTION_MIN_WORDS: 10,
  DESCRIPTION_MAX_WORDS: 1000,
  SKILLS_MAX_COUNT: 20,
} as const;
