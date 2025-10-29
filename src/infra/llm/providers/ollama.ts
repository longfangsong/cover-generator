/**
 * Ollama Provider Implementation
 * Direct HTTP API integration with Ollama
 */

import { LLMProvider, GenerationRequest, GenerationResponse, ProviderConfig, ValidationResult, LLMError } from '.';

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (Local)';
  readonly requiresApiKey = false;
  readonly supportsCustomEndpoint = true;

  private defaultEndpoint = 'http://localhost:11434';

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const endpoint = this.defaultEndpoint;
    const timeout = request.timeout || 30000; // 30s default

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestBody: any = {
        model: request.model,
        prompt: request.prompt,
        stream: false,
        format: request.responseSchema,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 8192,
        },
      };

      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          throw new LLMError(
            `Model '${request.model}' not found. Make sure the model is pulled in Ollama.`,
            'INVALID_RESPONSE',
            this.id
          );
        }
        
        throw new LLMError(errorMessage, 'NETWORK_ERROR', this.id);
      }

      const data = await response.json();

      if (!data.response) {
        throw new LLMError('Invalid response format from Ollama', 'INVALID_RESPONSE', this.id);
      }

      return {
        content: data.response,
        model: data.model || request.model,
        usage: data.prompt_eval_count && data.eval_count ? {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: data.prompt_eval_count + data.eval_count,
        } : undefined,
        finishReason: data.done ? 'stop' : 'error',
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof LLMError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new LLMError(
          `Ollama request timed out after ${timeout}ms. Try a smaller model or increase timeout.`,
          'TIMEOUT',
          this.id
        );
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new LLMError(
          'Cannot connect to Ollama. Is it running on localhost:11434?',
          'NETWORK_ERROR',
          this.id
        );
      }

      throw new LLMError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'NETWORK_ERROR',
        this.id
      );
    }
  }

  async validateConfig(config: ProviderConfig): Promise<ValidationResult> {
    const endpoint = config.endpoint || this.defaultEndpoint;

    try {
      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return {
          valid: false,
          error: `Cannot connect to Ollama at ${endpoint}. HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const availableModels = data.models?.map((m: { name: string }) => m.name) || [];

      if (availableModels.length === 0) {
        return {
          valid: false,
          error: 'No models found in Ollama. Please pull a model first (e.g., ollama pull llama2).',
        };
      }

      if (!availableModels.includes(config.model)) {
        return {
          valid: false,
          error: `Model '${config.model}' not found. Available models: ${availableModels.join(', ')}`,
          availableModels,
        };
      }

      return {
        valid: true,
        availableModels,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Cannot connect to Ollama. Is it running?',
      };
    }
  }

  async listModels(): Promise<string[]> {
    const endpoint = this.defaultEndpoint;

    try {
      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Cannot list models: HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  /**
   * Update the default endpoint (for testing or user configuration)
   */
  setEndpoint(endpoint: string): void {
    this.defaultEndpoint = endpoint;
  }
}
