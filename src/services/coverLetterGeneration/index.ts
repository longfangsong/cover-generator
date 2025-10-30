/**
 * GenerationService
 * Orchestrates the cover letter generation flow
 */

import { UserProfile } from '../../models/UserProfile';
import { JobDetails } from '../../models/JobDetails';
import { CoverLetterContent, CoverLetterState, LLMProviderEnum } from '../../models/CoverLetterContent';
import { buildPrompt, SectionInstructions } from './prompt';
import { BrowserStorageService } from '../../infra/storage';
import { createLogger } from '../../utils/logger';
import { validateJobDetails } from '../../models/validation/JobDetailsValidator';
import { globalRateLimiter } from '../../infra/llm/rateLimiter';
import { COVER_LETTER_SCHEMA } from '../../infra/llm/schemas';
import { LLMProvider } from '../../infra/llm';
import { validateProfile, ValidationError } from '../../models/validation/ProfileValidator';

const logger = createLogger('GenerationService');

export interface GenerationOptions {
  instructions?: SectionInstructions;
  saveToStorage?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerationResult {
  success: boolean;
  content?: CoverLetterContent;
  error?: string;
}

/**
 * Request format for PDF rendering API
 * Matches the contract defined in contracts/service-contracts.md
 */
export interface RenderRequest {
  /** Cover letter content sections */
  content: {
    addressee: string;
    opening: string;
    aboutMe: string;
    whyMe: string;
    whyCompany: string;
  };

  /** User profile information for header */
  userProfile: {
    name: string;
    email?: string;
    phone?: string;
  };

  /** Job details for recipient section */
  jobDetails: {
    company: string;
    position: string;
  };
}

/**
 * Validate inputs before generation
 */
export async function validateInputs(
  profile: UserProfile | null,
  job: JobDetails | null
): Promise<{ valid: boolean; error?: string }> {
  if (!profile) {
    return { valid: false, error: 'No profile found. Please create a profile first.' };
  }

  if (!job) {
    return { valid: false, error: 'No job details found. Please extract or enter job details first.' };
  }

  // Validate profile completeness
  const profileValidation = validateProfile(profile);
  if (!profileValidation.valid) {
    return {
      valid: false,
      error: `Profile validation failed: ${profileValidation.errors.map((e: ValidationError) => e.message).join(', ')}`
    };
  }

  // Validate job details
  const jobValidation = validateJobDetails(job);
  if (!jobValidation.valid) {
    return {
      valid: false,
      error: `Job details validation failed: ${jobValidation.errors.map((e: ValidationError) => e.message).join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Parse LLM response to extract cover letter sections
 */
export function parseLLMResponse(responseText: string): {
  addressee: string;
  opening: string;
  aboutMe: string;
  whyMe: string;
  whyCompany: string;
} | null {
  try {
    // Remove markdown code blocks if present (```json ... ```)
    let cleanedText = responseText.trim();
    const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) {
      cleanedText = jsonBlockMatch[1].trim();
    }

    // Try to parse as JSON
    const parsed = JSON.parse(cleanedText);
    
    if (parsed.addressee && parsed.opening && parsed.aboutMe && parsed.whyMe && parsed.whyCompany) {
      return {
        addressee: parsed.addressee.trim(),
        opening: parsed.opening.trim(),
        aboutMe: parsed.aboutMe.trim(),
        whyMe: parsed.whyMe.trim(),
        whyCompany: parsed.whyCompany.trim(),
      };
    }
  } catch (e) {
    // Not JSON, try to extract sections from text
    console.warn('[Generation] Response not JSON, attempting text extraction', e);
  }

  // Fallback: try to extract sections from text using markers
  const sections = {
    addressee: extractSection(responseText, ['addressee', 'to:', 'dear']),
    opening: extractSection(responseText, ['opening', 'greeting', '1.']),
    aboutMe: extractSection(responseText, ['about me', 'about_me', 'aboutme', '2.']),
    whyMe: extractSection(responseText, ['why me', 'why_me', 'whyme', '3.']),
    whyCompany: extractSection(responseText, ['why company', 'why_company', 'whycompany', '4.']),
  };

  if (sections.addressee && sections.opening && sections.aboutMe && sections.whyMe && sections.whyCompany) {
    return sections;
  }

  return null;
}

/**
 * Extract a section from text using various markers
 */
function extractSection(text: string, markers: string[]): string {
  const lowerText = text.toLowerCase();
  
  for (const marker of markers) {
    const markerIndex = lowerText.indexOf(marker);
    if (markerIndex === -1) continue;

    // Find the start of content after marker
    let contentStart = markerIndex + marker.length;
    // Skip past colons, newlines, etc.
    while (contentStart < text.length && /[\s:*#-]/.test(text[contentStart])) {
      contentStart++;
    }

    // Find the end (next section marker or end of text)
    let contentEnd = text.length;
    for (const nextMarker of markers) {
      const nextIndex = lowerText.indexOf(nextMarker, contentStart);
      if (nextIndex !== -1 && nextIndex < contentEnd) {
        contentEnd = nextIndex;
      }
    }

    return text.slice(contentStart, contentEnd).trim();
  }

  return '';
}

/**
 * Generate cover letter using LLM provider
 */
export async function generateCoverLetter(
  provider: LLMProvider,
  profile: UserProfile,
  job: JobDetails,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  try {
    // Check rate limit
    if (!globalRateLimiter.canMakeRequest()) {
      const waitTime = Math.ceil(globalRateLimiter.getTimeUntilNextRequest() / 1000);
      const error = `Rate limit exceeded. You can make ${globalRateLimiter.getRemainingRequests()} more requests. Please wait ${waitTime} seconds.`;
      logger.warn('Rate limit exceeded', { 
        remaining: globalRateLimiter.getRemainingRequests(),
        waitTime 
      });
      return {
        success: false,
        error,
      };
    }

    // Record the request
    globalRateLimiter.recordRequest();
    
    logger.info('Starting cover letter generation', {
      profileId: profile.id,
      jobId: job.id,
      company: job.company,
      position: job.title,
    });

    // Build prompt
    const prompt = buildPrompt(profile, job, options.instructions);

    // Call LLM with model from options
    const response = await provider.generate({
      prompt,
      model: options.model || 'gemini-2.5-flash', // Use model from options or default
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 8192,
      timeout: 30000,
      responseSchema: COVER_LETTER_SCHEMA, // Use cover letter schema for structured output
    });

    // Parse response
    const sections = parseLLMResponse(response.content);
    if (!sections) {
      logger.error('Failed to parse LLM response', undefined, { 
        responseLength: response.content.length,
        model: response.model 
      });
      return {
        success: false,
        error: 'Failed to parse LLM response. The response format was invalid.',
      };
    }

    logger.info('Successfully generated cover letter', {
      profileId: profile.id,
      jobId: job.id,
      model: response.model,
      usage: response.usage,
    });

    // Create cover letter content
    const llmProviderEnum = provider.id === 'ollama' ? LLMProviderEnum.OLLAMA : LLMProviderEnum.GEMINI;
    
    const coverLetter: CoverLetterContent = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      jobId: job.id,
      position: job.title,
      addressee: sections.addressee,
      opening: sections.opening,
      aboutMe: sections.aboutMe,
      whyMe: sections.whyMe,
      whyCompany: sections.whyCompany,
      generatedAt: new Date(),
      llmProvider: llmProviderEnum,
      llmModel: response.model,
      state: CoverLetterState.GENERATED,
    };

    // Save to storage if requested
    if (options.saveToStorage) {
      const storage = new BrowserStorageService();
      await storage.saveCoverLetter(coverLetter);
    }

    return {
      success: true,
      content: coverLetter,
    };
  } catch (error) {
    logger.error('Failed to generate cover letter', error as Error, {
      profileId: profile.id,
      jobId: job.id,
    });
    
    let errorMessage = 'An unexpected error occurred during generation.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update cover letter content and track editedAt timestamp
 */
export async function updateCoverLetterSection(
  letterId: string,
  section: 'opening' | 'aboutMe' | 'whyMe' | 'whyCompany',
  content: string,
  saveToStorage: boolean = true
): Promise<void> {
  if (!saveToStorage) {
    return;
  }

  const storage = new BrowserStorageService();
  const letter = await storage.loadCoverLetter(letterId);
  
  if (!letter) {
    throw new Error('Cover letter not found');
  }

  // Update the section
  letter[section] = content;
  letter.editedAt = new Date();

  // Save back to storage
  await storage.saveCoverLetter(letter);
}
