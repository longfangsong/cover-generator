/**
 * JobDetailsValidator
 * Validates JobDetails data against constraints
 */

import { JobDetails, JOB_DETAILS_CONSTRAINTS } from '../jobDetails';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
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
 * Validate complete JobDetails
 */
export function validateJobDetails(job: JobDetails): ValidationResult {
  const errors: ValidationError[] = [];

  // URL validation
  if (!isValidUrl(job.url)) {
    errors.push({
      field: 'url',
      message: 'Job URL must be a valid URL',
    });
  }

  // Company validation
  if (
    job.company.length < JOB_DETAILS_CONSTRAINTS.COMPANY_MIN_LENGTH ||
    job.company.length > JOB_DETAILS_CONSTRAINTS.COMPANY_MAX_LENGTH
  ) {
    errors.push({
      field: 'company',
      message: `Company name must be between ${JOB_DETAILS_CONSTRAINTS.COMPANY_MIN_LENGTH} and ${JOB_DETAILS_CONSTRAINTS.COMPANY_MAX_LENGTH} characters`,
    });
  }

  // Title validation
  if (
    job.title.length < JOB_DETAILS_CONSTRAINTS.TITLE_MIN_LENGTH ||
    job.title.length > JOB_DETAILS_CONSTRAINTS.TITLE_MAX_LENGTH
  ) {
    errors.push({
      field: 'title',
      message: `Job title must be between ${JOB_DETAILS_CONSTRAINTS.TITLE_MIN_LENGTH} and ${JOB_DETAILS_CONSTRAINTS.TITLE_MAX_LENGTH} characters`,
    });
  }

  // Description validation
  if (
    job.description.length < JOB_DETAILS_CONSTRAINTS.DESCRIPTION_MIN_LENGTH ||
    job.description.length > JOB_DETAILS_CONSTRAINTS.DESCRIPTION_MAX_LENGTH
  ) {
    errors.push({
      field: 'description',
      message: `Job description must be between ${JOB_DETAILS_CONSTRAINTS.DESCRIPTION_MIN_LENGTH} and ${JOB_DETAILS_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
