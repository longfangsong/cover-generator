import { v4 as uuidv4 } from 'uuid';
import { JobDetails, JobPlatform } from '../../../models/jobDetails';
import { JobExtractor, ExtractionError } from '..';

/**
 * Extractor for Arbetsförmedlingen job postings
 * Supports arbetsformedlingen.se/platsbanken/annonser URLs
 */
export class ArbetsformedlingenExtractor implements JobExtractor {
  readonly id = 'arbetsformedlingen';
  readonly name = 'Arbetsförmedlingen';
  readonly urlPatterns = [
    /^https?:\/\/(www\.)?arbetsformedlingen\.se\/platsbanken\/annonser\/\d+/,
  ];

  /**
   * Check if URL matches Arbetsförmedlingen job posting pattern
   * @param url - The URL to check
   * @returns true if URL matches arbetsformedlingen.se job posting pattern
   */
  canExtract(url: string): boolean {
    return this.urlPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extract job details from Arbetsförmedlingen page
   * @param document - The DOM document to extract from (must be fully rendered)
   * @returns JobDetails object with extracted data
   * @throws ExtractionError if required fields cannot be extracted
   */
  async extract(document: Document): Promise<JobDetails | null> {
    try {
      const url = document.location.href;

      if (!this.canExtract(url)) {
        throw new ExtractionError(
          'URL does not match Arbetsförmedlingen job posting pattern',
          this.name,
          url
        );
      }

      // Extract company name
      const company = this.extractCompany(document);
      if (!company) {
        throw new ExtractionError('Could not extract company name', this.name, url);
      }

      // Extract job title
      const title = this.extractTitle(document);
      if (!title) {
        throw new ExtractionError('Could not extract job title', this.name, url);
      }

      // Extract job description
      const description = this.extractDescription(document);
      if (!description) {
        throw new ExtractionError('Could not extract job description', this.name, url);
      }

      const jobDetails: JobDetails = {
        id: uuidv4(),
        url,
        company,
        title,
        description,
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      if (!this.validate(jobDetails)) {
        throw new ExtractionError('Extracted data failed validation', this.name, url);
      }

      console.log('[ArbetsformedlingenExtractor] Extraction successful');
      return jobDetails;
    } catch (error) {
      console.error('[ArbetsformedlingenExtractor] Extraction failed:', error);
      if (error instanceof ExtractionError) {
        throw error;
      }
      throw new ExtractionError(
        `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        document.location.href
      );
    }
  }

  /**
   * Validate extracted job details
   * @param details - The JobDetails object to validate
   * @returns true if all validation checks pass
   */
  validate(details: JobDetails): boolean {
    return !!(
      details.company &&
      details.company.length > 0 &&
      details.company.length <= 200 &&
      details.title &&
      details.title.length > 0 &&
      details.title.length <= 200 &&
      details.description &&
      details.description.length >= 10 &&
      details.description.length <= 10000 &&
      details.url &&
      details.platform === JobPlatform.ARBETSFORMEDLINGEN
    );
  }

  /**
   * Extract company name from DOM
   * Primary selector: h2#pb-company-name
   * 
   * SELECTOR STABILITY: The #pb-company-name ID is a semantic identifier
   * likely to remain stable. If Arbetsförmedlingen changes their page structure,
   * this selector may need updates. Fallback selectors provide resilience.
   * 
   * @param document - The DOM document
   * @returns Company name or null if not found
   */
  private extractCompany(document: Document): string | null {
    // Arbetsförmedlingen uses a specific ID for company name
    const selectors = [
      'h2#pb-company-name',
      '#pb-company-name',
      '[id*="company-name"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    return null;
  }

  /**
   * Extract job title from DOM
   * Primary selector: h1[data-read-assistance-title]
   * 
   * SELECTOR STABILITY: The data-read-assistance-title attribute is for
   * accessibility and likely stable. However, Arbetsförmedlingen could
   * change their accessibility implementation, requiring selector updates.
   * 
   * @param document - The DOM document
   * @returns Job title or null if not found
   */
  private extractTitle(document: Document): string | null {
    // Arbetsförmedlingen uses data-read-assistance-title attribute
    const selectors = [
      'h1[data-read-assistance-title]',
      '[data-read-assistance-title]',
      'h1.job-title',
      'h1',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    return null;
  }

  /**
   * Extract job description from DOM
   * Primary selector: .section.job-description
   * Converts HTML to formatted plain text
   * 
   * SELECTOR STABILITY: Class-based selectors like .job-description are
   * moderately stable but can change with UI redesigns. The fallback
   * selectors provide resilience against minor changes.
   * 
   * @param document - The DOM document
   * @returns Job description or null if not found
   */
  private extractDescription(document: Document): string | null {
    // Arbetsförmedlingen uses .section.job-description for the main description
    const selectors = [
      '.section.job-description',
      '.job-description',
      '[class*="job-description"]',
      '[class*="description"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Clone the element to avoid modifying the original DOM
        const clone = element.cloneNode(true) as HTMLElement;

        // Replace <br> tags with newlines before extracting text
        const brTags = clone.querySelectorAll('br');
        brTags.forEach(br => {
          br.replaceWith('\n');
        });

        // Replace block-level elements with newlines
        const blockElements = clone.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6');
        blockElements.forEach(block => {
          // Add newline after each block element
          if (block.nextSibling) {
            block.after('\n');
          }
        });

        const text = clone.textContent?.trim();
        if (text) {
          // Normalize whitespace but preserve line breaks
          // Replace multiple spaces/tabs with single space, but keep newlines
          return text
            .replace(/[ \t]+/g, ' ')  // Replace multiple spaces/tabs with single space
            .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with 2 newlines
            .trim();
        }
      }
    }

    return null;
  }

  /**
   * Extract skills from DOM
   * Looks for qualifications and skills sections
   * 
   * SELECTOR STABILITY: The lib-pb-feature-job-qualifications custom element
   * is part of Arbetsförmedlingen's Angular components. Custom element names
   * are relatively stable but could change with major framework updates.
   * 
   * @param document - The DOM document
   * @returns Array of skill strings (may be empty)
   */
  private extractSkills(document: Document): string[] {
    const skills: string[] = [];

    // Arbetsförmedlingen uses lib-pb-feature-job-qualifications for skills
    const skillSelectors = [
      'lib-pb-feature-job-qualifications .skill-item',
      'lib-pb-feature-job-qualifications span',
      '[class*="qualification"] .skill-item',
      '[class*="skill"]',
    ];

    for (const selector of skillSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const skill = element.textContent?.trim();
        if (skill && !skills.includes(skill)) {
          skills.push(skill);
        }
      });

      // If we found skills, break early
      if (skills.length > 0) {
        break;
      }
    }

    return skills;
  }
}
