/**
 * Education model
 * Represents educational credentials.
 */

export interface Education {
  /** Unique identifier (UUID v4) */
  id: string;

  /** School/university name (1-200 chars) */
  institution: string;

  /** Degree type (e.g., "B.S. Computer Science") (1-200 chars) */
  degree: string;

  /** Field of study (1-200 chars) */
  field?: string;

  /** Start date (ISO 8601) */
  startDate?: Date;

  /** Graduation date (ISO 8601, after startDate, null = in progress) */
  endDate?: Date;
}

/**
 * Validation constants for Education
 */
export const EDUCATION_CONSTRAINTS = {
  INSTITUTION_MIN_LENGTH: 1,
  INSTITUTION_MAX_LENGTH: 200,
  DEGREE_MIN_LENGTH: 1,
  DEGREE_MAX_LENGTH: 200,
  FIELD_MIN_LENGTH: 1,
  FIELD_MAX_LENGTH: 200,
} as const;
