import { SchemaUnion } from "@google/genai";

export interface GenerationRequest {
  prompt: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  responseSchema?: SchemaUnion;
}

export interface GenerationResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'error';
}

export interface ProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  availableModels?: string[];
}

export class LLMError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK_ERROR' | 'INVALID_API_KEY' | 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_RESPONSE',
    public provider: string
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export interface LLMProvider {
  /** Provider unique identifier */
  readonly id: string;
  
  /** Display name for UI */
  readonly name: string;
  
  /** Whether this provider requires an API key */
  readonly requiresApiKey: boolean;
  
  /** Whether this provider supports custom endpoints */
  readonly supportsCustomEndpoint: boolean;
  
  /**
   * Generate cover letter content from prompt
   * @throws LLMError if generation fails
   */
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  
  /**
   * Validate provider configuration
   * @returns true if config is valid and service is reachable
   */
  validateConfig(config: ProviderConfig): Promise<ValidationResult>;
  
  /**
   * List available models for this provider
   */
  listModels?(): Promise<string[]>;
}
