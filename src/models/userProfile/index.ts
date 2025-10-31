/**
 * UserProfile model
 * Represents the job seeker's personal and professional information.
 * Storage: Browser local storage (plaintext)
 */

import { Experience } from './experience';
import { Project } from './project';
import { Education } from './education';

export interface UserProfile {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Full name (1-200 chars) */
  name: string;

  /** Contact email (valid email format) */
  email: string;

  /** Contact phone (E.164 format optional) */
  phone?: string;

  /** Personal website/portfolio URL (valid URL) */
  homepage?: string;

  /** GitHub profile URL or username (valid URL or username) */
  github?: string;

  /** LinkedIn profile URL (valid URL) */
  linkedin?: string;

  /** Work history (Min 0, Max 15 combined with projects) */
  experience: Experience[];

  /** Personal projects (Min 0, Max 15 combined with experience) */
  projects: Project[];

  /** Professional skills (Min 1, Max 100, each 1-100 chars) */
  skills: string[];

  /** Educational background (Max 10) */
  education: Education[];

  /** Profile creation timestamp (ISO 8601) */
  createdAt: Date;

  /** Last modification timestamp (ISO 8601) */
  updatedAt: Date;
}

/**
 * Validation constants for UserProfile
 */
export const USER_PROFILE_CONSTRAINTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 200,
  SKILLS_MIN_COUNT: 1,
  SKILLS_MAX_COUNT: 100,
  SKILL_MIN_LENGTH: 1,
  SKILL_MAX_LENGTH: 100,
  EXPERIENCE_MIN_COUNT: 0,
  EXPERIENCE_MAX_COUNT: 15,
  PROJECTS_MIN_COUNT: 0,
  PROJECTS_MAX_COUNT: 15,
  COMBINED_EXPERIENCE_PROJECTS_MIN_COUNT: 1,
  COMBINED_EXPERIENCE_PROJECTS_MAX_COUNT: 15,
  EDUCATION_MAX_COUNT: 10,
} as const;
