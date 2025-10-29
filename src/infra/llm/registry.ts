/**
 * LLM Registry
 * Manages registration and retrieval of LLM providers
 */

import { LLMProvider } from './providers';

export class LLMRegistry {
  private providers: Map<string, LLMProvider> = new Map();

  /**
   * Register a new LLM provider
   */
  register(provider: LLMProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider ${provider.id} is already registered, overwriting`);
    }
    this.providers.set(provider.id, provider);
  }

  /**
   * Get a provider by ID
   * @throws Error if provider not found
   */
  get(id: string): LLMProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider ${id} not found. Available providers: ${this.listIds().join(', ')}`);
    }
    return provider;
  }

  /**
   * Check if a provider is registered
   */
  has(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * List all registered provider IDs
   */
  listIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * List all registered providers
   */
  listProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Unregister a provider
   */
  unregister(id: string): boolean {
    return this.providers.delete(id);
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
  }
}

// Singleton instance
export const llmRegistry = new LLMRegistry();
