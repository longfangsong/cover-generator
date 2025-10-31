import { JobDetails } from '../../models/jobDetails';

/**
 * Interface for job posting extractors
 * Each platform (LinkedIn, Indeed, Glassdoor) implements this interface
 */
export interface JobExtractor {
  /** Platform unique identifier */
  readonly id: string;
  
  /** Display name for UI */
  readonly name: string;
  
  /** URL patterns this extractor can handle */
  readonly urlPatterns: RegExp[];
  
  /**
   * Check if this extractor can handle the given URL
   */
  canExtract(url: string): boolean;
  
  /**
   * Extract job details from page DOM
   * @returns JobDetails or null if extraction fails
   */
  extract(document: Document): Promise<JobDetails | null>;
  
  /**
   * Validate extracted data
   * @returns true if all required fields present
   */
  validate(details: JobDetails): boolean;
}

/**
 * Error thrown when job extraction fails
 */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public platform: string,
    public url: string
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}
