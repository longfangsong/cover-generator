/**
 * Response Schemas for Structured LLM Output
 * Centralized schema definitions for different use cases
 */

/**
 * Schema for cover letter generation
 * Used when generating cover letters from profile and job details
 * Compatible with Google GenAI SchemaUnion type
 */
export const COVER_LETTER_SCHEMA = {
  type: 'object' as const,
  properties: {
    addressee: {
      type: 'string' as const,
      description: 'The addressee for the cover letter (e.g., "Hiring Manager", "Hiring Team", specific person\'s name if mentioned in job posting)'
    },
    opening: {
      type: 'string' as const,
      description: 'The opening paragraph of the cover letter, including greeting'
    },
    aboutMe: {
      type: 'string' as const,
      description: 'The "About Me" section introducing the candidate\'s background'
    },
    whyMe: {
      type: 'string' as const,
      description: 'The "Why Me" section explaining why the candidate is a good fit'
    },
    whyCompany: {
      type: 'string' as const,
      description: 'The "Why Company" section explaining interest in the company'
    }
  },
  required: ['addressee', 'opening', 'aboutMe', 'whyMe', 'whyCompany']
};

/**
 * Schema for resume extraction
 * Used when extracting structured profile data from resume text
 * Note: Complex nested objects (experience[], education[]) are not included in schema
 * because not all providers support deep nesting in structured output.
 * Instead, we rely on prompt-based JSON extraction for full resume parsing.
 */
export const RESUME_EXTRACTION_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: {
      type: 'string' as const,
      description: 'Full name of the candidate'
    },
    email: {
      type: 'string' as const,
      description: 'Email address'
    },
    phone: {
      type: 'string' as const,
      description: 'Phone number (optional)'
    },
    homepage: {
      type: 'string' as const,
      description: 'Personal website URL (optional)'
    },
    github: {
      type: 'string' as const,
      description: 'GitHub profile URL (optional)'
    },
    linkedin: {
      type: 'string' as const,
      description: 'LinkedIn profile URL (optional)'
    },
    skills: {
      type: 'array' as const,
      description: 'List of skills extracted from resume'
    },
    // Note: experience and education are complex nested objects
    // Not all providers support nested schemas in structured output
    // For these cases, fall back to prompt-based extraction with JSON parsing
  },
  required: ['name', 'email']
};
