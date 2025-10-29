/**
 * CoverLetterContent model
 * Represents a generated or edited cover letter.
 * Storage: Browser local storage (plaintext)
 */

/**
 * LLM providers supported for generation
 */
export enum LLMProviderEnum {
  OLLAMA = 'Ollama',
  GEMINI = 'Gemini',
}

/**
 * Cover letter state transitions:
 * [Created] → [Generated] → [Edited] → [Exported]
 */
export enum CoverLetterState {
  CREATED = 'Created',       // Empty template, awaiting generation
  GENERATED = 'Generated',   // LLM has returned content, not yet edited
  EDITED = 'Edited',         // User has modified at least one section
  EXPORTED = 'Exported',     // User has exported to PDF or copied to clipboard
}

export interface CoverLetterContent {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Associated user profile ID (references UserProfile.id) */
  profileId: string;

  /** Associated job details ID (references JobDetails.id) */
  jobId: string;

  /** Position being applied for (from JobDetails.title) (1-200 chars) */
  position: string;

  /** Addressee/company name (e.g., "Hiring Manager", company name) (1-200 chars) */
  addressee: string;

  /** Opening/greeting section (50-1000 chars) */
  opening: string;

  /** About me section (introduction, background) (100-2000 chars) */
  aboutMe: string;

  /** Why I'm a good fit (relevant experience, skills) (100-2000 chars) */
  whyMe: string;

  /** Why this company/position (motivation, alignment) (100-2000 chars) */
  whyCompany: string;

  /** Initial generation timestamp (ISO 8601) */
  generatedAt: Date;

  /** Last edit timestamp (ISO 8601) */
  editedAt?: Date;

  /** Provider used for generation */
  llmProvider: LLMProviderEnum;

  /** Model name (e.g., "llama2", "gemini-pro") (1-100 chars) */
  llmModel: string;

  /** Current state of the cover letter */
  state: CoverLetterState;
}

/**
 * Validation constants for CoverLetterContent
 */
export const COVER_LETTER_CONSTRAINTS = {
  POSITION_MIN_LENGTH: 1,
  POSITION_MAX_LENGTH: 200,
  ADDRESSEE_MIN_LENGTH: 1,
  ADDRESSEE_MAX_LENGTH: 200,
  OPENING_MIN_LENGTH: 50,
  OPENING_MAX_LENGTH: 1000,
  ABOUT_ME_MIN_LENGTH: 100,
  ABOUT_ME_MAX_LENGTH: 2000,
  WHY_ME_MIN_LENGTH: 100,
  WHY_ME_MAX_LENGTH: 2000,
  WHY_COMPANY_MIN_LENGTH: 100,
  WHY_COMPANY_MAX_LENGTH: 2000,
  MODEL_MIN_LENGTH: 1,
  MODEL_MAX_LENGTH: 100,
} as const;
