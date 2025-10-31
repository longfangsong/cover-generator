/**
 * Google Gemini Provider Implementation
 * Using @google/genai SDK
 */

import { GoogleGenAI } from '@google/genai';
import { LLMProvider, GenerationRequest, GenerationResponse, ProviderConfig, ValidationResult, LLMError } from '.';
import { browserStorageService } from '../../storage';

export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly requiresApiKey = true;
  readonly supportsCustomEndpoint = false;

  private apiKey: string | null = null;
  private apiKeyLoaded = false;
  private storageService = browserStorageService;

  private async ensureApiKey(): Promise<void> {
    if (!this.apiKeyLoaded) {
      const config = await this.storageService.loadLLMSettings();
      if (config && config.providerId === 'gemini' && config.apiKey) {
        this.apiKey = config.apiKey;
      }
      this.apiKeyLoaded = true;
    }
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    await this.ensureApiKey();
    
    if (!this.apiKey) {
      throw new LLMError('Gemini API key not configured', 'INVALID_API_KEY', this.id);
    }

    const timeout = request.timeout || 30000; // 30s default
    const timeoutId = setTimeout(() => {
      throw new LLMError(
        `Gemini request timed out after ${timeout}ms`,
        'TIMEOUT',
        this.id
      );
    }, timeout);

    try {
      const client = new GoogleGenAI({ apiKey: this.apiKey });

      const response = await client.models.generateContent({
        model: request.model,
        contents: request.prompt,
        config: {
          maxOutputTokens: request.maxTokens ?? 8192,
          temperature: request.temperature ?? 0.7,
          responseMimeType: 'application/json',
          responseSchema: request.responseSchema,
        },
      });

      clearTimeout(timeoutId);

      // Log response for debugging
      console.log('[GeminiProvider] Response:', response);

      // Check if response was blocked
      if (response.promptFeedback?.blockReason) {
        throw new LLMError(
          `Content was blocked: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || ''}`,
          'INVALID_RESPONSE',
          this.id
        );
      }

      // Check if there are no candidates
      if (!response.candidates || response.candidates.length === 0) {
        throw new LLMError(
          'No response candidates generated. This might be due to content filtering or model limitations.',
          'INVALID_RESPONSE',
          this.id
        );
      }

      // Check if the response was cut off due to max tokens
      const firstCandidate = response.candidates[0];
      if (firstCandidate?.finishReason === 'MAX_TOKENS') {
        throw new LLMError(
          `Response was truncated due to token limit (${request.maxTokens} tokens). Please increase the Max Tokens setting in Settings tab (recommended: 4096-16384).`,
          'INVALID_RESPONSE',
          this.id
        );
      }

      const text = response.text;

      if (!text) {
        console.error('[GeminiProvider] Empty text in response:', JSON.stringify(response, null, 2));
        throw new LLMError(
          'Empty response from Gemini. This might be due to content filtering or token limits.',
          'INVALID_RESPONSE',
          this.id
        );
      }

      // Extract usage metadata if available
      const usage = response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        completionTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0,
      } : undefined;

      return {
        content: text,
        model: request.model,
        usage,
        finishReason: 'stop',
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof LLMError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new LLMError(
          `Gemini request timed out after ${timeout}ms`,
          'TIMEOUT',
          this.id
        );
      }

      // Handle Gemini SDK errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Parse common Gemini errors
      if (errorMessage.includes('API key')) {
        throw new LLMError(
          'Invalid Gemini API key. Get one at https://makersuite.google.com',
          'INVALID_API_KEY',
          this.id
        );
      }

      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        throw new LLMError(
          'Gemini API quota exceeded. Check your usage at Google Cloud Console.',
          'RATE_LIMIT',
          this.id
        );
      }

      if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
        throw new LLMError(
          'Content was blocked by safety filters. Try rephrasing your profile.',
          'INVALID_RESPONSE',
          this.id
        );
      }

      if (errorMessage.includes('model not found')) {
        throw new LLMError(
          `Model '${request.model}' not found or not available`,
          'INVALID_RESPONSE',
          this.id
        );
      }

      throw new LLMError(
        errorMessage,
        'NETWORK_ERROR',
        this.id
      );
    }
  }

  async validateConfig(config: ProviderConfig): Promise<ValidationResult> {
    if (!config.apiKey) {
      return {
        valid: false,
        error: 'API key is required for Gemini',
      };
    }

    // Update internal API key for subsequent calls
    this.apiKey = config.apiKey;

    try {
      // Test API key with a minimal request
      const client = new GoogleGenAI({ apiKey: config.apiKey });

      await client.models.generateContent({
        model: config.model,
        contents: 'Hello',
        config: {
          maxOutputTokens: 10,
        },
      });

      return {
        valid: true,
        availableModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro'],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('API key')) {
        return {
          valid: false,
          error: 'Invalid API key. Get one at https://makersuite.google.com',
        };
      }

      if (errorMessage.includes('model not found')) {
        return {
          valid: false,
          error: `Model '${config.model}' not available. Try 'gemini-2.5-flash'`,
          availableModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro'],
        };
      }

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  async listModels(): Promise<string[]> {
    // Gemini doesn't provide a public API to list models
    // Return known models
    return ['gemini-2.5-flash', 'gemini-2.5-pro'];
  }

  /**
   * Set API key (for configuration updates)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}
