/**
 * LLMProviderConfig model
 * Represents user's LLM provider settings.
 * Storage: Browser local storage (plaintext)
 */

import { LLMProviderEnum } from './CoverLetterContent';

export interface LLMProviderConfig {
  /** Selected provider */
  providerId: LLMProviderEnum;

  /** API key (required for Gemini) (1-500 chars) */
  apiKey?: string;

  /** Custom endpoint (Ollama only, default: http://localhost:11434) (valid URL) */
  endpoint?: string;

  /** Model name (e.g., "llama2", "gemini-pro") (1-100 chars) */
  model: string;

  /** Generation temperature (0.0-2.0, default: 0.7) */
  temperature?: number;

  /** Max output tokens (100-4096, default: 1024) */
  maxTokens?: number;

  /** Last configuration update (ISO 8601) */
  updatedAt: Date;
}

/**
 * Validation constants and defaults for LLMProviderConfig
 */
export const LLM_CONFIG_CONSTRAINTS = {
  API_KEY_MIN_LENGTH: 1,
  API_KEY_MAX_LENGTH: 500,
  MODEL_MIN_LENGTH: 1,
  MODEL_MAX_LENGTH: 100,
  TEMPERATURE_MIN: 0.0,
  TEMPERATURE_MAX: 2.0,
  TEMPERATURE_DEFAULT: 0.7,
  MAX_TOKENS_MIN: 100,
  MAX_TOKENS_MAX: 8192,
  MAX_TOKENS_DEFAULT: 2048,
  OLLAMA_DEFAULT_ENDPOINT: 'http://localhost:11434',
} as const;

/**
 * Validate LLM provider configuration
 * @throws Error if validation fails
 */
export function validateLLMConfig(config: LLMProviderConfig): void {
  // Gemini requires API key
  if (config.providerId === LLMProviderEnum.GEMINI && !config.apiKey) {
    throw new Error('API key is required for Gemini provider');
  }

  // Validate temperature range
  if (
    config.temperature !== undefined &&
    (config.temperature < LLM_CONFIG_CONSTRAINTS.TEMPERATURE_MIN ||
      config.temperature > LLM_CONFIG_CONSTRAINTS.TEMPERATURE_MAX)
  ) {
    throw new Error(
      `Temperature must be between ${LLM_CONFIG_CONSTRAINTS.TEMPERATURE_MIN} and ${LLM_CONFIG_CONSTRAINTS.TEMPERATURE_MAX}`
    );
  }

  // Validate maxTokens range
  if (
    config.maxTokens !== undefined &&
    (config.maxTokens < LLM_CONFIG_CONSTRAINTS.MAX_TOKENS_MIN ||
      config.maxTokens > LLM_CONFIG_CONSTRAINTS.MAX_TOKENS_MAX)
  ) {
    throw new Error(
      `Max tokens must be between ${LLM_CONFIG_CONSTRAINTS.MAX_TOKENS_MIN} and ${LLM_CONFIG_CONSTRAINTS.MAX_TOKENS_MAX}`
    );
  }
}
