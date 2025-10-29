import { v4 as uuidv4 } from 'uuid';
import { JobDetails, JobPlatform } from '../../../models/JobDetails';
import { JobExtractor, ExtractionError } from '..';

/**
 * Extractor for LinkedIn job postings
 * Supports both linkedin.com/jobs and linkedin.com/in/jobs URLs
 */
export class LinkedInExtractor implements JobExtractor {
  readonly id = 'linkedin';
  readonly name = 'LinkedIn';
  readonly urlPatterns = [
    /^https?:\/\/(www\.)?linkedin\.com\/jobs\/.+/,
    /^https?:\/\/(www\.)?linkedin\.com\/in\/.+\/jobs\/.+/,
  ];

  canExtract(url: string): boolean {
    return this.urlPatterns.some(pattern => pattern.test(url));
  }

  async extract(document: Document): Promise<JobDetails | null> {
    try {
      const url = document.location.href;
      
      if (!this.canExtract(url)) {
        throw new ExtractionError(
          'URL does not match LinkedIn job posting pattern',
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

      // Extract skills (optional)
      const skills = this.extractSkills(document);

      const jobDetails: JobDetails = {
        id: uuidv4(),
        url,
        company,
        title,
        description,
        skills,
        platform: JobPlatform.LINKEDIN,
        extractedAt: new Date(),
        isManual: false,
      };

      if (!this.validate(jobDetails)) {
        throw new ExtractionError('Extracted data failed validation', this.name, url);
      }

      return jobDetails;
    } catch (error) {
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
      details.platform === JobPlatform.LINKEDIN
    );
  }

  private extractCompany(document: Document): string | null {
    // LinkedIn job postings have company name in various selectors
    const selectors = [
      '.topcard__org-name-link',
      '.job-details-jobs-unified-top-card__company-name',
      'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
      '.topcard__flavor--company',
      '[class*="company-name"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    return null;
  }

  private extractTitle(document: Document): string | null {
    // LinkedIn job title selectors
    const selectors = [
      '.topcard__title',
      '.job-details-jobs-unified-top-card__job-title',
      'h1[class*="job-title"]',
      'h2[class*="job-title"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    return null;
  }

  private extractDescription(document: Document): string | null {
    // LinkedIn job description is typically in a div with specific classes
    const selectors = [
      '.description__text',
      '.show-more-less-html__markup',
      '[class*="job-description"]',
      '.jobs-description__content',
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
        const blockElements = clone.querySelectorAll('p, div, li');
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

  private extractSkills(document: Document): string[] {
    const skills: string[] = [];
    
    // LinkedIn sometimes shows skill pills or badges
    const skillSelectors = [
      '.job-details-skill-match-status-list__skill',
      '[class*="skill-pill"]',
      '[class*="skill-badge"]',
    ];

    for (const selector of skillSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const skill = element.textContent?.trim();
        if (skill && !skills.includes(skill)) {
          skills.push(skill);
        }
      });
    }

    return skills;
  }
}
