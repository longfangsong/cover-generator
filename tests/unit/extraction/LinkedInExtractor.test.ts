import { describe, it, expect, beforeEach } from 'vitest';
import { LinkedInExtractor } from '../../../src/services/extraction/platforms/LinkedInExtractor';
import { JobPlatform } from '../../../src/models/JobDetails';

describe('LinkedInExtractor', () => {
  let extractor: LinkedInExtractor;

  beforeEach(() => {
    extractor = new LinkedInExtractor();
  });

  describe('canExtract', () => {
    it('should match LinkedIn job URLs', () => {
      expect(extractor.canExtract('https://www.linkedin.com/jobs/view/123456')).toBe(true);
      expect(extractor.canExtract('https://linkedin.com/jobs/view/123456')).toBe(true);
      expect(extractor.canExtract('http://www.linkedin.com/jobs/search/123')).toBe(true);
    });

    it('should match LinkedIn user job URLs', () => {
      expect(extractor.canExtract('https://www.linkedin.com/in/johndoe/jobs/123')).toBe(true);
      expect(extractor.canExtract('https://linkedin.com/in/jane-smith/jobs/456')).toBe(true);
    });

    it('should not match non-LinkedIn URLs', () => {
      expect(extractor.canExtract('https://www.indeed.com/jobs/view/123')).toBe(false);
      expect(extractor.canExtract('https://www.glassdoor.com/job/123')).toBe(false);
      expect(extractor.canExtract('https://www.linkedin.com/feed')).toBe(false);
      expect(extractor.canExtract('https://www.google.com')).toBe(false);
    });
  });

  describe('extract', () => {
    it('should extract complete job details from LinkedIn page', async () => {
      // Create a mock DOM
      const mockDocument = createMockLinkedInDOM({
        company: 'Acme Corp',
        title: 'Senior Software Engineer',
        description: 'We are looking for a talented engineer to join our team. You will work on exciting projects using React, TypeScript, and Node.js. The ideal candidate has 5+ years of experience.',
        skills: ['React', 'TypeScript', 'Node.js'],
      });

      const result = await extractor.extract(mockDocument);

      expect(result).not.toBeNull();
      expect(result?.company).toBe('Acme Corp');
      expect(result?.title).toBe('Senior Software Engineer');
      expect(result?.description).toContain('talented engineer');
      expect(result?.skills).toEqual(['React', 'TypeScript', 'Node.js']);
      expect(result?.platform).toBe(JobPlatform.LINKEDIN);
      expect(result?.isManual).toBe(false);
      expect(result?.extractedAt).toBeInstanceOf(Date);
      expect(result?.url).toContain('linkedin.com/jobs');
    });

    it('should handle missing skills gracefully', async () => {
      const mockDocument = createMockLinkedInDOM({
        company: 'Test Company',
        title: 'Developer',
        description: 'A great opportunity to work with us on interesting challenges.',
        skills: [],
      });

      const result = await extractor.extract(mockDocument);

      expect(result).not.toBeNull();
      expect(result?.skills).toEqual([]);
    });

    it('should throw error if company is missing', async () => {
      const mockDocument = createMockLinkedInDOM({
        company: '',
        title: 'Developer',
        description: 'A job description',
        skills: [],
      });

      await expect(extractor.extract(mockDocument)).rejects.toThrow('Could not extract company name');
    });

    it('should throw error if title is missing', async () => {
      const mockDocument = createMockLinkedInDOM({
        company: 'Test Corp',
        title: '',
        description: 'A job description',
        skills: [],
      });

      await expect(extractor.extract(mockDocument)).rejects.toThrow('Could not extract job title');
    });

    it('should throw error if description is missing', async () => {
      const mockDocument = createMockLinkedInDOM({
        company: 'Test Corp',
        title: 'Developer',
        description: '',
        skills: [],
      });

      await expect(extractor.extract(mockDocument)).rejects.toThrow('Could not extract job description');
    });

    it('should throw error for non-LinkedIn URL', async () => {
      const mockDocument = {
        location: { href: 'https://www.indeed.com/jobs/view/123' },
        querySelector: () => null,
        querySelectorAll: () => [],
      } as unknown as Document;

      await expect(extractor.extract(mockDocument)).rejects.toThrow('URL does not match LinkedIn job posting pattern');
    });
  });

  describe('validate', () => {
    it('should validate correct job details', () => {
      const validJob = {
        id: 'test-id',
        url: 'https://www.linkedin.com/jobs/view/123',
        company: 'Test Company',
        title: 'Software Engineer',
        description: 'This is a valid job description with sufficient length.',
        skills: ['JavaScript', 'React'],
        platform: JobPlatform.LINKEDIN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(validJob)).toBe(true);
    });

    it('should reject job with empty company', () => {
      const invalidJob = {
        id: 'test-id',
        url: 'https://www.linkedin.com/jobs/view/123',
        company: '',
        title: 'Software Engineer',
        description: 'This is a valid job description with sufficient length.',
        skills: [],
        platform: JobPlatform.LINKEDIN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidJob)).toBe(false);
    });

    it('should reject job with too short description', () => {
      const invalidJob = {
        id: 'test-id',
        url: 'https://www.linkedin.com/jobs/view/123',
        company: 'Test Company',
        title: 'Software Engineer',
        description: 'Too short',
        skills: [],
        platform: JobPlatform.LINKEDIN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidJob)).toBe(false);
    });

    it('should reject job with company name too long', () => {
      const invalidJob = {
        id: 'test-id',
        url: 'https://www.linkedin.com/jobs/view/123',
        company: 'A'.repeat(201),
        title: 'Software Engineer',
        description: 'This is a valid job description with sufficient length.',
        skills: [],
        platform: JobPlatform.LINKEDIN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidJob)).toBe(false);
    });
  });
});

/**
 * Helper function to create a mock LinkedIn DOM
 */
function createMockLinkedInDOM(data: {
  company: string;
  title: string;
  description: string;
  skills: string[];
}): Document {
  const mockElements = new Map<string, HTMLElement>();

  // Create company element
  if (data.company) {
    const companyEl = document.createElement('a');
    companyEl.className = 'topcard__org-name-link';
    companyEl.textContent = data.company;
    mockElements.set('.topcard__org-name-link', companyEl);
  }

  // Create title element
  if (data.title) {
    const titleEl = document.createElement('h1');
    titleEl.className = 'topcard__title';
    titleEl.textContent = data.title;
    mockElements.set('.topcard__title', titleEl);
  }

  // Create description element
  if (data.description) {
    const descEl = document.createElement('div');
    descEl.className = 'description__text';
    descEl.textContent = data.description;
    mockElements.set('.description__text', descEl);
  }

  // Create skill elements
  const skillElements: HTMLElement[] = data.skills.map(skill => {
    const skillEl = document.createElement('span');
    skillEl.className = 'job-details-skill-match-status-list__skill';
    skillEl.textContent = skill;
    return skillEl;
  });

  const mockDocument = {
    location: { href: 'https://www.linkedin.com/jobs/view/123456' },
    querySelector: (selector: string) => mockElements.get(selector) || null,
    querySelectorAll: (selector: string) => {
      if (selector === '.job-details-skill-match-status-list__skill') {
        return skillElements;
      }
      return [];
    },
  } as unknown as Document;

  return mockDocument;
}
