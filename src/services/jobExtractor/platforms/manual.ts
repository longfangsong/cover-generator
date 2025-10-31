import { v4 as uuidv4 } from 'uuid';
import { JobDetails, JobPlatform } from '../../../models/jobDetails';
import { JobExtractor } from '..';

/**
 * Manual job details extractor (fallback)
 * Used when automatic extraction is not possible or for unsupported platforms
 */
export class ManualExtractor implements JobExtractor {
  readonly id = 'manual';
  readonly name = 'Manual Entry';
  readonly urlPatterns: RegExp[] = []; // Matches nothing - this is always a fallback

  canExtract(url: string): boolean {
    // Manual extractor can handle any URL as a fallback
    return true;
  }

  async extract(document: Document): Promise<JobDetails | null> {
    // Manual extractor returns a template that the user must fill in
    const url = document.location.href;

    const jobDetails: JobDetails = {
      id: uuidv4(),
      url,
      company: '',
      title: '',
      description: '',
      platform: JobPlatform.MANUAL,
      extractedAt: new Date(),
      isManual: true,
    };

    return jobDetails;
  }

  validate(details: JobDetails): boolean {
    // For manual entry, we allow empty fields initially
    // Validation will happen when user tries to generate cover letter
    return !!(
      details.url &&
      details.platform === JobPlatform.MANUAL
    );
  }

  /**
   * Create a manual job details template with given URL
   * @param url The job posting URL
   * @returns Empty JobDetails template for manual entry
   */
  createTemplate(url: string): JobDetails {
    return {
      id: uuidv4(),
      url,
      company: '',
      title: '',
      description: '',
      platform: JobPlatform.MANUAL,
      extractedAt: new Date(),
      isManual: true,
    };
  }
}
