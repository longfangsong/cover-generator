/**
 * ResumeExtractor Service
 * 
 * Extracts structured profile data from resume text using LLM.
 * Uses the configured LLM provider to parse unstructured resume text
 * into structured UserProfile data.
 */

import { UserProfile } from '../../models/userProfile';
import { Experience } from '../../models/userProfile/experience';
import { Education } from '../../models/userProfile/education';
import { Project } from '../../models/userProfile/project';
import { browserStorageService } from '../../infra/storage';
import { buildPrompt } from './prompt';
import { createLogger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { llmRegistry } from '../../infra/llm';

const logger = createLogger('ResumeExtractor');

/**
 * Parse date string safely, returning undefined for invalid dates
 */
function parseDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString || typeof dateString !== 'string' || !dateString.trim()) {
    return undefined;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) ? date : undefined;
}

export interface ResumeExtractionResult {
  profile: Partial<UserProfile>;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

export interface ExtractionOptions {
  saveToStorage?: boolean;
}

/**
 * Extract structured profile data from resume text
 * 
 * @param resumeText - Raw text extracted from PDF resume
 * @param options - Extraction options
 * @returns ResumeExtractionResult with profile, confidence level, and warnings
 */
export async function extractProfile(
  resumeText: string,
  options: ExtractionOptions = {}
): Promise<ResumeExtractionResult> {
  if (!resumeText || resumeText.trim().length < 100) {
    throw new Error('Resume text is too short to extract meaningful information');
  }

  const storageService = browserStorageService;

  // Get the configured LLM provider
  const providerConfig = await storageService.loadLLMSettings();
  if (!providerConfig) {
    throw new Error('No LLM provider configured. Please configure a provider in Settings.');
  }

  // Convert provider ID to lowercase for registry lookup
  const providerId = providerConfig.providerId.toLowerCase();
  const provider = llmRegistry.get(providerId);

  try {
    logger.info('Starting resume extraction', {
      resumeLength: resumeText.length,
      provider: providerId,
    });

    // Call LLM with structured output
    // All providers support structured output, so we use responseSchema for reliable, 
    // validated JSON responses for the nested resume structure.
    const request = {
      prompt: buildPrompt(resumeText),
      model: providerConfig.model,
      maxTokens: providerConfig.maxTokens,
      temperature: 0.1, // Low temperature for structured extraction
      responseSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          homepage: { type: 'string' },
          github: { type: 'string' },
          linkedin: { type: 'string' },
          experience: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                company: { type: 'string' },
                role: { type: 'string' },
                startDate: { type: 'string' },
                endDate: { type: 'string' },
                description: { type: 'string' },
                skills: { type: 'array', items: { type: 'string' } }
              },
              required: ['company', 'role', 'startDate', 'description']
            }
          },
          education: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                institution: { type: 'string' },
                degree: { type: 'string' },
                field: { type: 'string' },
                startDate: { type: 'string' },
                endDate: { type: 'string' }
              },
              required: ['institution', 'degree']
            }
          },
          skills: {
            type: 'array',
            items: { type: 'string' }
          },
          projects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                technologies: { type: 'array', items: { type: 'string' } },
                startDate: { type: 'string' },
                endDate: { type: 'string' }
              },
              required: ['name', 'description']
            }
          }
        },
        required: ['name', 'email', 'skills']
      }
    };
    const response = await provider.generate(request);

    logger.info('Successfully extracted resume using LLM', {
      provider: providerId,
      model: response.model,
    });

    // Parse LLM response
    return parseExtractionResponse(response.content);
  } catch (error: any) {
    logger.error('Failed to extract profile from resume', error as Error, {
      provider: providerId,
    });
    throw new Error(`Failed to extract profile from resume: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Parse LLM response into structured profile data
 */
function parseExtractionResponse(response: string): ResumeExtractionResult {
  const warnings: string[] = [];
  
  try {
    // Clean response (remove markdown code blocks if present)
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON
    const parsed = JSON.parse(cleanedResponse);

    // Validate and construct profile
    const profile = constructProfile(parsed, warnings);

    // Determine confidence based on extracted fields and warnings
    const confidence = calculateConfidence(profile, warnings);

    return {
      profile,
      confidence,
      warnings
    };
  } catch (error: any) {
    throw new Error(`Failed to parse LLM response: ${error?.message || 'Invalid JSON format'}`);
  }
}

/**
 * Construct UserProfile from parsed data
 */
function constructProfile(parsed: any, warnings: string[]): Partial<UserProfile> {
  const profile: Partial<UserProfile> = {};

  // Extract basic fields
  if (parsed.name && typeof parsed.name === 'string') {
    profile.name = parsed.name.trim().substring(0, 200);
  } else {
    warnings.push('Name not found in resume');
  }

  if (parsed.email && typeof parsed.email === 'string') {
    profile.email = parsed.email.trim().toLowerCase();
    // Basic email validation
    if (profile.email && !profile.email.includes('@')) {
      warnings.push('Email format may be invalid');
    }
  } else {
    warnings.push('Email not found in resume');
  }

  if (parsed.phone && typeof parsed.phone === 'string') {
    profile.phone = parsed.phone.trim();
  }

  if (parsed.homepage && typeof parsed.homepage === 'string') {
    profile.homepage = parsed.homepage.trim();
  }

  if (parsed.github && typeof parsed.github === 'string') {
    profile.github = parsed.github.trim();
  }

  if (parsed.linkedin && typeof parsed.linkedin === 'string') {
    profile.linkedin = parsed.linkedin.trim();
  }

  // Extract experience
  if (Array.isArray(parsed.experience) && parsed.experience.length > 0) {
    profile.experience = parsed.experience
      .slice(0, 15) // Max 15 entries
      .map((exp: any) => parseExperience(exp, warnings))
      .filter((exp: Experience | null): exp is Experience => exp !== null);
    
    if (profile.experience && profile.experience.length === 0) {
      warnings.push('No valid work experience found');
    }
  } else {
    warnings.push('No work experience found in resume');
  }

  // Extract skills
  if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
    profile.skills = parsed.skills
      .filter((skill: any) => typeof skill === 'string' && skill.trim().length > 0)
      .map((skill: string) => skill.trim().substring(0, 100))
      .slice(0, 100);
    
    if (profile.skills && profile.skills.length === 0) {
      warnings.push('No valid skills found');
    }
  } else {
    warnings.push('No skills found in resume');
  }

  // Extract education
  if (Array.isArray(parsed.education) && parsed.education.length > 0) {
    profile.education = parsed.education
      .slice(0, 10) // Max 10 entries
      .map((edu: any) => parseEducation(edu, warnings))
      .filter((edu: Education | null): edu is Education => edu !== null);
  }

  // Extract projects
  if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
    profile.projects = parsed.projects
      .slice(0, 15) // Max 15 entries combined with experience
      .map((proj: any) => parseProject(proj, warnings))
      .filter((proj: Project | null): proj is Project => proj !== null);
    
    if (profile.projects && profile.projects.length === 0) {
      warnings.push('No valid projects found');
    }
  }

  return profile;
}

/**
 * Parse single experience entry
 */
function parseExperience(exp: any, warnings: string[]): Experience | null {
  if (!exp.company || !exp.role || !exp.startDate || !exp.description) {
    warnings.push(`Incomplete experience entry: ${exp.role || 'Unknown role'}`);
    return null;
  }

  const startDate = parseDate(exp.startDate);
  if (!startDate) {
    warnings.push(`Invalid start date in experience: ${exp.role}`);
    return null;
  }

  const endDate = parseDate(exp.endDate);

  console.log('Parsing experience entry:', exp);
  return {
    id: uuidv4(),
    company: String(exp.company).trim().substring(0, 200),
    role: String(exp.role).trim().substring(0, 200),
    startDate,
    endDate,
    description: String(exp.description).trim(),
    skills: Array.isArray(exp.skills) 
      ? exp.skills.filter((s: any) => typeof s === 'string').slice(0, 20)
      : []
  };
}

/**
 * Parse single education entry
 */
function parseEducation(edu: any, warnings: string[]): Education | null {
  if (!edu.institution || !edu.degree) {
    warnings.push('Incomplete education entry');
    return null;
  }

  const startDate = parseDate(edu.startDate);
  const endDate = parseDate(edu.endDate);

  return {
    id: uuidv4(),
    institution: String(edu.institution).trim().substring(0, 200),
    degree: String(edu.degree).trim().substring(0, 200),
    field: edu.field ? String(edu.field).trim().substring(0, 200) : undefined,
    startDate,
    endDate
  };
}

/**
 * Parse single project entry
 */
function parseProject(proj: any, warnings: string[]): Project | null {
  if (!proj.name || !proj.description || !proj.startDate) {
    warnings.push(`Incomplete project entry: ${proj.name || 'Unknown project'}`);
    return null;
  }

  const startDate = parseDate(proj.startDate);
  if (!startDate) {
    warnings.push(`Invalid start date in project: ${proj.name}`);
    return null;
  }

  const endDate = parseDate(proj.endDate);

  return {
    id: uuidv4(),
    name: String(proj.name).trim().substring(0, 200),
    organization: proj.organization ? String(proj.organization).trim().substring(0, 200) : undefined,
    startDate,
    endDate,
    description: String(proj.description).trim(),
    skills: Array.isArray(proj.technologies) || Array.isArray(proj.skills)
      ? (proj.technologies || proj.skills).filter((s: any) => typeof s === 'string').slice(0, 20)
      : []
  };
}

/**
 * Calculate confidence score based on extracted data
 */
function calculateConfidence(
  profile: Partial<UserProfile>, 
  warnings: string[]
): 'high' | 'medium' | 'low' {
  // Count required fields
  const hasName = !!profile.name;
  const hasEmail = !!profile.email;
  const hasExperience = (profile.experience?.length ?? 0) > 0;
  const hasSkills = (profile.skills?.length ?? 0) > 0;

  // High confidence: All required fields + minimal warnings
  if (hasName && hasEmail && hasExperience && hasSkills && warnings.length <= 2) {
    return 'high';
  }

  // Low confidence: Missing critical fields or many warnings
  if (!hasName || !hasEmail || warnings.length > 5) {
    return 'low';
  }

  // Medium confidence: Everything else
  return 'medium';
}
