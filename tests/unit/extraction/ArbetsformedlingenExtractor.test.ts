import { describe, it, expect, beforeEach } from 'vitest';
import { ArbetsformedlingenExtractor } from '../../../src/services/jobExtractor/platforms/arbetsformedlingen';
import { JobPlatform } from '../../../src/models/JobDetails';
import { ExtractionError } from '../../../src/services/jobExtractor';

describe('ArbetsformedlingenExtractor', () => {
  let extractor: ArbetsformedlingenExtractor;

  beforeEach(() => {
    extractor = new ArbetsformedlingenExtractor();
  });

  describe('canExtract', () => {
    it('should return true for valid arbetsformedlingen.se job posting URL', () => {
      const url = 'https://arbetsformedlingen.se/platsbanken/annonser/30001375';
      expect(extractor.canExtract(url)).toBe(true);
    });

    it('should return true for valid arbetsformedlingen.se job posting URL with www prefix', () => {
      const url = 'https://www.arbetsformedlingen.se/platsbanken/annonser/30001375';
      expect(extractor.canExtract(url)).toBe(true);
    });

    it('should return true for valid arbetsformedlingen.se job posting URL with query parameters', () => {
      const url = 'https://arbetsformedlingen.se/platsbanken/annonser/30001375?ps=ams';
      expect(extractor.canExtract(url)).toBe(true);
    });

    it('should return true for http URL (not just https)', () => {
      const url = 'http://arbetsformedlingen.se/platsbanken/annonser/30001375';
      expect(extractor.canExtract(url)).toBe(true);
    });

    it('should return false for arbetsformedlingen.se homepage', () => {
      const url = 'https://arbetsformedlingen.se/';
      expect(extractor.canExtract(url)).toBe(false);
    });

    it('should return false for arbetsformedlingen.se search page', () => {
      const url = 'https://arbetsformedlingen.se/platsbanken';
      expect(extractor.canExtract(url)).toBe(false);
    });

    it('should return false for LinkedIn URL', () => {
      const url = 'https://linkedin.com/jobs/view/123';
      expect(extractor.canExtract(url)).toBe(false);
    });

    it('should return false for other site', () => {
      const url = 'https://example.com/jobs/123';
      expect(extractor.canExtract(url)).toBe(false);
    });
  });

  describe('extract', () => {
    it('should extract all job details successfully from valid DOM', async () => {
      const mockDOM = createMockArbetsformedlingenDOM({
        company: 'Eldorado A/S',
        title: 'Säljchef till Västra Götalands län',
        description: 'Vill du kombinera affärsmannaskap med ledarskap och driva en viktig del av vår verksamhet framåt?',
        skills: ['Ledarskap', 'Försäljning', 'Svenska'],
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
      });

      const result = await extractor.extract(mockDOM);

      expect(result).not.toBeNull();
      expect(result?.company).toBe('Eldorado A/S');
      expect(result?.title).toBe('Säljchef till Västra Götalands län');
      expect(result?.description).toBe('Vill du kombinera affärsmannaskap med ledarskap och driva en viktig del av vår verksamhet framåt?');
      expect(result?.skills).toEqual(['Ledarskap', 'Försäljning', 'Svenska']);
      expect(result?.platform).toBe(JobPlatform.ARBETSFORMEDLINGEN);
      expect(result?.url).toBe('https://arbetsformedlingen.se/platsbanken/annonser/30001375');
      expect(result?.isManual).toBe(false);
      expect(result?.id).toBeDefined();
      expect(result?.extractedAt).toBeInstanceOf(Date);
    });

    it('should extract job details with empty skills array when no skills found', async () => {
      const mockDOM = createMockArbetsformedlingenDOM({
        company: 'Test Company',
        title: 'Test Job',
        description: 'Test description with enough characters to pass validation rules.',
        skills: [],
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/12345',
      });

      const result = await extractor.extract(mockDOM);

      expect(result).not.toBeNull();
      expect(result?.skills).toEqual([]);
    });

    it('should throw ExtractionError when company is missing', async () => {
      const mockDOM = createMockArbetsformedlingenDOM({
        company: null,
        title: 'Test Job',
        description: 'Test description',
        skills: [],
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/12345',
      });

      await expect(extractor.extract(mockDOM)).rejects.toThrow(ExtractionError);
      await expect(extractor.extract(mockDOM)).rejects.toThrow('Could not extract company name');
    });

    it('should throw ExtractionError when title is missing', async () => {
      const mockDOM = createMockArbetsformedlingenDOM({
        company: 'Test Company',
        title: null,
        description: 'Test description',
        skills: [],
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/12345',
      });

      await expect(extractor.extract(mockDOM)).rejects.toThrow(ExtractionError);
      await expect(extractor.extract(mockDOM)).rejects.toThrow('Could not extract job title');
    });

    it('should throw ExtractionError when description is missing', async () => {
      const mockDOM = createMockArbetsformedlingenDOM({
        company: 'Test Company',
        title: 'Test Job',
        description: null,
        skills: [],
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/12345',
      });

      await expect(extractor.extract(mockDOM)).rejects.toThrow(ExtractionError);
      await expect(extractor.extract(mockDOM)).rejects.toThrow('Could not extract job description');
    });

    it('should throw ExtractionError when URL does not match pattern', async () => {
      const mockDOM = createMockArbetsformedlingenDOM({
        company: 'Test Company',
        title: 'Test Job',
        description: 'Test description',
        skills: [],
        url: 'https://arbetsformedlingen.se/other-page',
      });

      await expect(extractor.extract(mockDOM)).rejects.toThrow(ExtractionError);
      await expect(extractor.extract(mockDOM)).rejects.toThrow('URL does not match Arbetsförmedlingen job posting pattern');
    });
  });

  describe('validate', () => {
    it('should return true for valid JobDetails', () => {
      const validDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: 'Test Company',
        title: 'Test Job',
        description: 'Valid description with sufficient length for validation.',
        skills: ['Skill 1', 'Skill 2'],
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(validDetails)).toBe(true);
    });

    it('should return false when company is empty', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: '',
        title: 'Test Job',
        description: 'Valid description',
        skills: [],
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });

    it('should return false when company exceeds 200 characters', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: 'A'.repeat(201),
        title: 'Test Job',
        description: 'Valid description',
        skills: [],
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });

    it('should return false when title is empty', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: 'Test Company',
        title: '',
        description: 'Valid description',
        skills: [],
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });

    it('should return false when title exceeds 200 characters', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: 'Test Company',
        title: 'A'.repeat(201),
        description: 'Valid description',
        skills: [],
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });

    it('should return false when description is too short (less than 10 chars)', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: 'Test Company',
        title: 'Test Job',
        description: 'Short',
        skills: [],
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });

    it('should return false when description exceeds 10000 characters', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: 'Test Company',
        title: 'Test Job',
        description: 'A'.repeat(10001),
        skills: [],
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });

    it('should return false when platform is not ARBETSFORMEDLINGEN', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: 'Test Company',
        title: 'Test Job',
        description: 'Valid description',
        skills: [],
        platform: JobPlatform.LINKEDIN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });

    it('should return false when skills is not an array', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://arbetsformedlingen.se/platsbanken/annonser/30001375',
        company: 'Test Company',
        title: 'Test Job',
        description: 'Valid description',
        skills: 'not an array' as any,
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });

    it('should return false when URL is missing', () => {
      const invalidDetails = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: '',
        company: 'Test Company',
        title: 'Test Job',
        description: 'Valid description',
        skills: [],
        platform: JobPlatform.ARBETSFORMEDLINGEN,
        extractedAt: new Date(),
        isManual: false,
      };

      expect(extractor.validate(invalidDetails)).toBe(false);
    });
  });

  describe('User Story 2: Error Handling', () => {
    describe('non-job page detection', () => {
      it('should return false for homepage URL', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/')).toBe(false);
      });

      it('should return false for search results URL', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken')).toBe(false);
      });

      it('should return false for other sections', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/for-arbetssokande')).toBe(false);
      });
    });

    describe('missing optional fields handling', () => {
      it('should succeed when skills are missing (empty array)', async () => {
        const mockDOM = createMockArbetsformedlingenDOM({
          company: 'Test Company',
          title: 'Test Job',
          description: 'Valid description with enough content for validation.',
          skills: [], // No skills
          url: 'https://arbetsformedlingen.se/platsbanken/annonser/12345',
        });

        const result = await extractor.extract(mockDOM);

        expect(result).not.toBeNull();
        expect(result?.skills).toEqual([]);
      });
    });

    describe('validation failures with error messages', () => {
      it('should throw ExtractionError with platform name when company missing', async () => {
        const mockDOM = createMockArbetsformedlingenDOM({
          company: null,
          title: 'Test Job',
          description: 'Test description',
          skills: [],
          url: 'https://arbetsformedlingen.se/platsbanken/annonser/12345',
        });

        try {
          await extractor.extract(mockDOM);
          expect.fail('Should have thrown ExtractionError');
        } catch (error) {
          expect(error).toBeInstanceOf(ExtractionError);
          if (error instanceof ExtractionError) {
            expect(error.platform).toBe('Arbetsförmedlingen');
            expect(error.url).toBe('https://arbetsformedlingen.se/platsbanken/annonser/12345');
            expect(error.message).toContain('company');
          }
        }
      });

      it('should throw ExtractionError with platform name when title missing', async () => {
        const mockDOM = createMockArbetsformedlingenDOM({
          company: 'Test Company',
          title: null,
          description: 'Test description',
          skills: [],
          url: 'https://arbetsformedlingen.se/platsbanken/annonser/12345',
        });

        try {
          await extractor.extract(mockDOM);
          expect.fail('Should have thrown ExtractionError');
        } catch (error) {
          expect(error).toBeInstanceOf(ExtractionError);
          if (error instanceof ExtractionError) {
            expect(error.platform).toBe('Arbetsförmedlingen');
            expect(error.url).toBe('https://arbetsformedlingen.se/platsbanken/annonser/12345');
            expect(error.message).toContain('title');
          }
        }
      });

      it('should throw ExtractionError with platform name when description missing', async () => {
        const mockDOM = createMockArbetsformedlingenDOM({
          company: 'Test Company',
          title: 'Test Job',
          description: null,
          skills: [],
          url: 'https://arbetsformedlingen.se/platsbanken/annonser/12345',
        });

        try {
          await extractor.extract(mockDOM);
          expect.fail('Should have thrown ExtractionError');
        } catch (error) {
          expect(error).toBeInstanceOf(ExtractionError);
          if (error instanceof ExtractionError) {
            expect(error.platform).toBe('Arbetsförmedlingen');
            expect(error.url).toBe('https://arbetsformedlingen.se/platsbanken/annonser/12345');
            expect(error.message).toContain('description');
          }
        }
      });
    });
  });

  describe('User Story 3: Multiple URL Patterns', () => {
    describe('URL patterns with www prefix', () => {
      it('should match URL with www prefix', () => {
        expect(extractor.canExtract('https://www.arbetsformedlingen.se/platsbanken/annonser/12345')).toBe(true);
      });

      it('should match URL without www prefix', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken/annonser/12345')).toBe(true);
      });
    });

    describe('URL patterns with query parameters', () => {
      it('should match URL with single query parameter', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken/annonser/12345?ps=ams')).toBe(true);
      });

      it('should match URL with multiple query parameters', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken/annonser/12345?ps=ams&ref=search')).toBe(true);
      });

      it('should match URL with hash fragment', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken/annonser/12345#section')).toBe(true);
      });
    });

    describe('edge cases (trailing slashes, http vs https)', () => {
      it('should match URL with trailing slash', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken/annonser/12345/')).toBe(true);
      });

      it('should match http URL (not just https)', () => {
        expect(extractor.canExtract('http://arbetsformedlingen.se/platsbanken/annonser/12345')).toBe(true);
      });

      it('should match http URL with www', () => {
        expect(extractor.canExtract('http://www.arbetsformedlingen.se/platsbanken/annonser/12345')).toBe(true);
      });

      it('should not match URL with wrong path', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/other/12345')).toBe(false);
      });

      it('should not match URL without job ID', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken/annonser/')).toBe(false);
      });

      it('should not match URL with non-numeric job ID', () => {
        expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken/annonser/abc123')).toBe(false);
      });
    });
  });
});

/**
 * Helper function to create a mock Arbetsförmedlingen DOM for testing
 */
function createMockArbetsformedlingenDOM(options: {
  company: string | null;
  title: string | null;
  description: string | null;
  skills: string[];
  url: string;
}): Document {
  const mockElements = new Map<string, HTMLElement>();

  // Create company element
  if (options.company !== null) {
    const companyEl = document.createElement('h2');
    companyEl.id = 'pb-company-name';
    companyEl.textContent = options.company;
    mockElements.set('h2#pb-company-name', companyEl);
    mockElements.set('#pb-company-name', companyEl);
  }

  // Create title element
  if (options.title !== null) {
    const titleEl = document.createElement('h1');
    titleEl.setAttribute('data-read-assistance-title', 'true');
    titleEl.textContent = options.title;
    mockElements.set('h1[data-read-assistance-title]', titleEl);
    mockElements.set('[data-read-assistance-title]', titleEl);
  }

  // Create description element
  if (options.description !== null) {
    const descEl = document.createElement('div');
    descEl.className = 'section job-description';
    descEl.textContent = options.description;
    mockElements.set('.section.job-description', descEl);
    mockElements.set('.job-description', descEl);
  }

  // Create skill elements
  const skillElements: HTMLElement[] = options.skills.map(skill => {
    const skillEl = document.createElement('span');
    skillEl.className = 'skill-item';
    skillEl.textContent = skill;
    return skillEl;
  });

  const mockDocument = {
    location: { href: options.url },
    querySelector: (selector: string) => mockElements.get(selector) || null,
    querySelectorAll: (selector: string) => {
      if (selector === 'lib-pb-feature-job-qualifications .skill-item') {
        return skillElements;
      }
      if (selector === 'lib-pb-feature-job-qualifications span') {
        return skillElements;
      }
      return [];
    },
  } as unknown as Document;

  return mockDocument;
}
