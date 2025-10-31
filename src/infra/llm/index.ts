/**
 * LLM Service Index
 * Exports LLM providers and initializes registry
 */

export type { LLMProvider, GenerationRequest, GenerationResponse, ProviderConfig, ValidationResult } from './providers';
export { LLMError } from './providers';
export { LLMRegistry, llmRegistry } from './registry';
export { OllamaProvider } from './providers/ollama';
export { GeminiProvider } from './providers/gemini';

// Initialize and register providers
import { llmRegistry } from './registry';
import { OllamaProvider } from './providers/ollama';
import { GeminiProvider } from './providers/gemini';
import { BrowserStorageService } from '../storage';

// Register providers on module load
llmRegistry.register(new OllamaProvider());
const geminiProvider = new GeminiProvider();
llmRegistry.register(geminiProvider);
