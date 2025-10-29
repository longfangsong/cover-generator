/**
 * ProfileValidator
 * Validates UserProfile data against constraints (field limits, word counts)
 */

import {
  UserProfile,
  USER_PROFILE_CONSTRAINTS,
} from '../../models/UserProfile';
import {
  Experience,
  EXPERIENCE_CONSTRAINTS,
} from '../../models/Experience';
import {
  Project,
  PROJECT_CONSTRAINTS,
} from '../../models/Project';
import {
  Education,
  EDUCATION_CONSTRAINTS,
} from '../../models/Education';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Count words in a string (split on whitespace, count non-empty)
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a single Experience entry
 */
export function validateExperience(exp: Experience): ValidationResult {
  const errors: ValidationError[] = [];

  // Company validation (optional)
  if (
    exp.company &&
    (exp.company.length < EXPERIENCE_CONSTRAINTS.COMPANY_MIN_LENGTH ||
      exp.company.length > EXPERIENCE_CONSTRAINTS.COMPANY_MAX_LENGTH)
  ) {
    errors.push({
      field: 'company',
      message: `Company name must be between ${EXPERIENCE_CONSTRAINTS.COMPANY_MIN_LENGTH} and ${EXPERIENCE_CONSTRAINTS.COMPANY_MAX_LENGTH} characters`,
    });
  }

  // Role validation
  if (
    exp.role.length < EXPERIENCE_CONSTRAINTS.ROLE_MIN_LENGTH ||
    exp.role.length > EXPERIENCE_CONSTRAINTS.ROLE_MAX_LENGTH
  ) {
    errors.push({
      field: 'role',
      message: `Role must be between ${EXPERIENCE_CONSTRAINTS.ROLE_MIN_LENGTH} and ${EXPERIENCE_CONSTRAINTS.ROLE_MAX_LENGTH} characters`,
    });
  }

  // Description word count validation
  const wordCount = countWords(exp.description);
  if (
    wordCount < EXPERIENCE_CONSTRAINTS.DESCRIPTION_MIN_WORDS ||
    wordCount > EXPERIENCE_CONSTRAINTS.DESCRIPTION_MAX_WORDS
  ) {
    errors.push({
      field: 'description',
      message: `Description must be between ${EXPERIENCE_CONSTRAINTS.DESCRIPTION_MIN_WORDS} and ${EXPERIENCE_CONSTRAINTS.DESCRIPTION_MAX_WORDS} words (current: ${wordCount})`,
    });
  }

  // Date validation
  if (!(exp.startDate instanceof Date) || isNaN(exp.startDate.getTime())) {
    errors.push({
      field: 'startDate',
      message: 'Start date must be a valid date',
    });
  } else if (exp.startDate > new Date()) {
    errors.push({
      field: 'startDate',
      message: 'Start date cannot be in the future',
    });
  }

  // End date validation
  if (exp.endDate) {
    if (!(exp.endDate instanceof Date) || isNaN(exp.endDate.getTime())) {
      errors.push({
        field: 'endDate',
        message: 'End date must be a valid date',
      });
    } else if (exp.endDate <= exp.startDate) {
      errors.push({
        field: 'endDate',
        message: 'End date must be after start date',
      });
    }
  }

  // Skills validation
  if (exp.skills && exp.skills.length > EXPERIENCE_CONSTRAINTS.SKILLS_MAX_COUNT) {
    errors.push({
      field: 'skills',
      message: `Maximum ${EXPERIENCE_CONSTRAINTS.SKILLS_MAX_COUNT} skills per experience`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single Project entry
 */
export function validateProject(proj: Project): ValidationResult {
  const errors: ValidationError[] = [];

  // Organization validation (optional)
  if (
    proj.organization &&
    (proj.organization.length < PROJECT_CONSTRAINTS.ORGANIZATION_MIN_LENGTH ||
      proj.organization.length > PROJECT_CONSTRAINTS.ORGANIZATION_MAX_LENGTH)
  ) {
    errors.push({
      field: 'organization',
      message: `Organization must be between ${PROJECT_CONSTRAINTS.ORGANIZATION_MIN_LENGTH} and ${PROJECT_CONSTRAINTS.ORGANIZATION_MAX_LENGTH} characters`,
    });
  }

  // Name validation
  if (
    proj.name.length < PROJECT_CONSTRAINTS.NAME_MIN_LENGTH ||
    proj.name.length > PROJECT_CONSTRAINTS.NAME_MAX_LENGTH
  ) {
    errors.push({
      field: 'name',
      message: `Project name must be between ${PROJECT_CONSTRAINTS.NAME_MIN_LENGTH} and ${PROJECT_CONSTRAINTS.NAME_MAX_LENGTH} characters`,
    });
  }

  // Description word count validation
  const wordCount = countWords(proj.description);
  if (
    wordCount < PROJECT_CONSTRAINTS.DESCRIPTION_MIN_WORDS ||
    wordCount > PROJECT_CONSTRAINTS.DESCRIPTION_MAX_WORDS
  ) {
    errors.push({
      field: 'description',
      message: `Description must be between ${PROJECT_CONSTRAINTS.DESCRIPTION_MIN_WORDS} and ${PROJECT_CONSTRAINTS.DESCRIPTION_MAX_WORDS} words (current: ${wordCount})`,
    });
  }

  // Date validation
  if (!(proj.startDate instanceof Date) || isNaN(proj.startDate.getTime())) {
    errors.push({
      field: 'startDate',
      message: 'Start date must be a valid date',
    });
  } else if (proj.startDate > new Date()) {
    errors.push({
      field: 'startDate',
      message: 'Start date cannot be in the future',
    });
  }

  // End date validation
  if (proj.endDate) {
    if (!(proj.endDate instanceof Date) || isNaN(proj.endDate.getTime())) {
      errors.push({
        field: 'endDate',
        message: 'End date must be a valid date',
      });
    } else if (proj.endDate <= proj.startDate) {
      errors.push({
        field: 'endDate',
        message: 'End date must be after start date',
      });
    }
  }

  // Skills validation
  if (proj.skills && proj.skills.length > PROJECT_CONSTRAINTS.SKILLS_MAX_COUNT) {
    errors.push({
      field: 'skills',
      message: `Maximum ${PROJECT_CONSTRAINTS.SKILLS_MAX_COUNT} skills per project`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single Education entry
 */
export function validateEducation(edu: Education): ValidationResult {
  const errors: ValidationError[] = [];

  // Institution validation
  if (
    edu.institution.length < EDUCATION_CONSTRAINTS.INSTITUTION_MIN_LENGTH ||
    edu.institution.length > EDUCATION_CONSTRAINTS.INSTITUTION_MAX_LENGTH
  ) {
    errors.push({
      field: 'institution',
      message: `Institution must be between ${EDUCATION_CONSTRAINTS.INSTITUTION_MIN_LENGTH} and ${EDUCATION_CONSTRAINTS.INSTITUTION_MAX_LENGTH} characters`,
    });
  }

  // Degree validation
  if (
    edu.degree.length < EDUCATION_CONSTRAINTS.DEGREE_MIN_LENGTH ||
    edu.degree.length > EDUCATION_CONSTRAINTS.DEGREE_MAX_LENGTH
  ) {
    errors.push({
      field: 'degree',
      message: `Degree must be between ${EDUCATION_CONSTRAINTS.DEGREE_MIN_LENGTH} and ${EDUCATION_CONSTRAINTS.DEGREE_MAX_LENGTH} characters`,
    });
  }

  // Field validation (if provided)
  if (
    edu.field &&
    (edu.field.length < EDUCATION_CONSTRAINTS.FIELD_MIN_LENGTH ||
      edu.field.length > EDUCATION_CONSTRAINTS.FIELD_MAX_LENGTH)
  ) {
    errors.push({
      field: 'field',
      message: `Field must be between ${EDUCATION_CONSTRAINTS.FIELD_MIN_LENGTH} and ${EDUCATION_CONSTRAINTS.FIELD_MAX_LENGTH} characters`,
    });
  }

  // At least one of degree or field must be present
  if (!edu.degree && !edu.field) {
    errors.push({
      field: 'degree/field',
      message: 'Either degree or field of study must be provided',
    });
  }

  // Date validation
  if (edu.startDate && edu.endDate) {
    if (!(edu.startDate instanceof Date) || isNaN(edu.startDate.getTime())) {
      errors.push({
        field: 'startDate',
        message: 'Start date must be a valid date',
      });
    }
    if (!(edu.endDate instanceof Date) || isNaN(edu.endDate.getTime())) {
      errors.push({
        field: 'endDate',
        message: 'End date must be a valid date',
      });
    }
    if (edu.endDate <= edu.startDate) {
      errors.push({
        field: 'endDate',
        message: 'End date must be after start date',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete UserProfile
 */
export function validateProfile(profile: UserProfile): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation
  if (
    profile.name.length < USER_PROFILE_CONSTRAINTS.NAME_MIN_LENGTH ||
    profile.name.length > USER_PROFILE_CONSTRAINTS.NAME_MAX_LENGTH
  ) {
    errors.push({
      field: 'name',
      message: `Name must be between ${USER_PROFILE_CONSTRAINTS.NAME_MIN_LENGTH} and ${USER_PROFILE_CONSTRAINTS.NAME_MAX_LENGTH} characters`,
    });
  }

  // Email validation
  if (!isValidEmail(profile.email)) {
    errors.push({
      field: 'email',
      message: 'Email must be a valid email address',
    });
  }

  // URL validations
  if (profile.homepage && !isValidUrl(profile.homepage)) {
    errors.push({
      field: 'homepage',
      message: 'Homepage must be a valid URL',
    });
  }

  if (profile.github && !isValidUrl(profile.github)) {
    // Allow username format as well
    const isUsername = /^[a-zA-Z0-9-]+$/.test(profile.github);
    if (!isUsername) {
      errors.push({
        field: 'github',
        message: 'GitHub must be a valid URL or username',
      });
    }
  }

  if (profile.linkedin && !isValidUrl(profile.linkedin)) {
    errors.push({
      field: 'linkedin',
      message: 'LinkedIn must be a valid URL',
    });
  }

  // Experience validation
  if (profile.experience.length > USER_PROFILE_CONSTRAINTS.EXPERIENCE_MAX_COUNT) {
    errors.push({
      field: 'experience',
      message: `Maximum ${USER_PROFILE_CONSTRAINTS.EXPERIENCE_MAX_COUNT} experience entries allowed`,
    });
  }

  // Projects validation
  if (profile.projects && profile.projects.length > USER_PROFILE_CONSTRAINTS.PROJECTS_MAX_COUNT) {
    errors.push({
      field: 'projects',
      message: `Maximum ${USER_PROFILE_CONSTRAINTS.PROJECTS_MAX_COUNT} project entries allowed`,
    });
  }

  // Combined experience + projects validation
  const totalExperienceAndProjects = profile.experience.length + (profile.projects?.length || 0);
  if (totalExperienceAndProjects < USER_PROFILE_CONSTRAINTS.COMBINED_EXPERIENCE_PROJECTS_MIN_COUNT) {
    errors.push({
      field: 'experience',
      message: `At least ${USER_PROFILE_CONSTRAINTS.COMBINED_EXPERIENCE_PROJECTS_MIN_COUNT} work experience or project entry required`,
    });
  }

  if (totalExperienceAndProjects > USER_PROFILE_CONSTRAINTS.COMBINED_EXPERIENCE_PROJECTS_MAX_COUNT) {
    errors.push({
      field: 'experience',
      message: `Maximum ${USER_PROFILE_CONSTRAINTS.COMBINED_EXPERIENCE_PROJECTS_MAX_COUNT} combined experience and project entries allowed`,
    });
  }

  // Validate each experience entry
  profile.experience.forEach((exp, index) => {
    const result = validateExperience(exp);
    result.errors.forEach((error) => {
      errors.push({
        field: `experience[${index}].${error.field}`,
        message: error.message,
      });
    });
  });

  // Validate each project entry
  if (profile.projects) {
    profile.projects.forEach((proj, index) => {
      const result = validateProject(proj);
      result.errors.forEach((error) => {
        errors.push({
          field: `projects[${index}].${error.field}`,
          message: error.message,
        });
      });
    });
  }

  // Skills validation
  if (profile.skills.length < USER_PROFILE_CONSTRAINTS.SKILLS_MIN_COUNT) {
    errors.push({
      field: 'skills',
      message: `At least ${USER_PROFILE_CONSTRAINTS.SKILLS_MIN_COUNT} skill required`,
    });
  }

  if (profile.skills.length > USER_PROFILE_CONSTRAINTS.SKILLS_MAX_COUNT) {
    errors.push({
      field: 'skills',
      message: `Maximum ${USER_PROFILE_CONSTRAINTS.SKILLS_MAX_COUNT} skills allowed`,
    });
  }

  profile.skills.forEach((skill, index) => {
    if (
      skill.length < USER_PROFILE_CONSTRAINTS.SKILL_MIN_LENGTH ||
      skill.length > USER_PROFILE_CONSTRAINTS.SKILL_MAX_LENGTH
    ) {
      errors.push({
        field: `skills[${index}]`,
        message: `Skill must be between ${USER_PROFILE_CONSTRAINTS.SKILL_MIN_LENGTH} and ${USER_PROFILE_CONSTRAINTS.SKILL_MAX_LENGTH} characters`,
      });
    }
  });

  // Education validation
  if (profile.education.length > USER_PROFILE_CONSTRAINTS.EDUCATION_MAX_COUNT) {
    errors.push({
      field: 'education',
      message: `Maximum ${USER_PROFILE_CONSTRAINTS.EDUCATION_MAX_COUNT} education entries allowed`,
    });
  }

  // Validate each education entry
  profile.education.forEach((edu, index) => {
    const result = validateEducation(edu);
    result.errors.forEach((error) => {
      errors.push({
        field: `education[${index}].${error.field}`,
        message: error.message,
      });
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
