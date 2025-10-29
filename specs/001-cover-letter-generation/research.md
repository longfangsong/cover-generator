# Research: Core Cover Letter Generation

**Feature**: 001-cover-letter-generation  
**Date**: 2025-10-27  
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Research Tasks

### 1. PDF Parsing Library Selection

**Decision**: Use `pdfjs-dist` (Mozilla PDF.js) version 4.0+

**Rationale**:

- **Industry standard**: Used by Firefox built-in PDF viewer, highly maintained
- **Browser-native compatibility**: Works in browser extensions without node dependencies
- **Text extraction focus**: Excellent at extracting structured text from PDFs
- **TypeScript support**: Has @types/pdfjs-dist for full type safety
- **Size**: ~2MB minified, acceptable for extension bundle
- **Security**: Actively maintained with security patches

**Alternatives Considered**:

- **pdf.js-extract**: Simpler API but less maintained, last update 2 years ago
- **pdfjs-serverless**: Cloud-based, violates privacy principle (requires external service)
- **pdf-parse**: Node.js focused, difficult to bundle for browser
- **Apache PDFBox (via WASM)**: Too heavy (~10MB+), overkill for text extraction

**Implementation Notes**:

- Use worker thread for parsing to avoid blocking UI
- Set memory limits to handle 5MB PDF constraint
- Extract text layer-by-layer, prioritize most recent content

### 2. Ollama SDK/Client Integration

**Decision**: Use direct HTTP API calls with `fetch` (no dedicated SDK initially)

**Rationale**:

- **Simplicity**: Ollama's REST API is straightforward (POST /api/generate)
- **No dependencies**: Avoids adding SDK that may have node dependencies
- **Full control**: Can implement exactly what's needed (streaming, timeouts)
- **Local-first**: Ollama runs locally (localhost:11434 by default), no external auth
- **TypeScript**: Easy to type the request/response manually

**Alternatives Considered**:

- **ollama-js**: Official Node.js library, but requires bundler gymnastics for browser
- **langchain**: Too heavy (adds 1MB+), overkill for simple completion API
- **axios/ky**: Unnecessary when `fetch` is native and sufficient

**Implementation Notes**:

```typescript
interface OllamaProvider {
  generate(prompt: string, model: string): Promise<string>;
  stream?(prompt: string, model: string): AsyncIterable<string>;
}

// Default endpoint: http://localhost:11434/api/generate
// User can configure custom endpoint in settings
```

**Best Practices**:

- Check Ollama availability on settings save (health check endpoint)
- Provide clear error if Ollama not running: "Cannot connect to Ollama. Is it running on localhost:11434?"
- Support model selection (llama2, mistral, etc.) via dropdown in settings
- Implement request timeout (30s default)

### 3. Google Generative AI SDK for Gemini

**Decision**: Use `@google/generative-ai` SDK version 0.1.3+

**Rationale**:

- **Official SDK**: Maintained by Google, first-class TypeScript support
- **Lightweight**: ~50KB minified, minimal overhead
- **Safety features**: Built-in content filtering, error handling
- **API key authentication**: Simple bearer token, no OAuth complexity
- **Streaming support**: Can implement real-time generation feedback

**Alternatives Considered**:

- **Direct REST API**: More complex (auth, retries, error parsing)
- **LangChain Gemini**: Adds unnecessary abstraction layer
- **Vertex AI SDK**: Requires GCP project setup, too heavyweight for plugin

**Implementation Notes**:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiProvider {
  generate(prompt: string, apiKey: string): Promise<string>;
  model: 'gemini-pro' | 'gemini-pro-vision'; // Pro for text only
}

// API key stored encrypted in chrome.storage.local
// Rate limiting: Track timestamps of last 10 requests
```

**Best Practices**:

- Use `gemini-pro` model (text-only, no vision needed)
- Set `maxOutputTokens: 1024` (cover letters are ~500-800 tokens)
- Enable safety settings: HARM_CATEGORY_HARASSMENT = BLOCK_MEDIUM_AND_ABOVE
- Implement exponential backoff for rate limit errors (429)
- Clear error messages for invalid API key: "Invalid Gemini API key. Get one at https://makersuite.google.com/app/apikey"

### 4. Testing Framework Selection

**Decision**: Vitest for unit/integration tests + Playwright for E2E browser tests

**Rationale**:

**Vitest**:

- **Vite-native**: Already using Vite for bundling, seamless integration
- **Fast**: Native ESM, parallel execution, instant watch mode
- **Jest-compatible**: Familiar API (describe, test, expect)
- **TypeScript**: First-class support, no ts-jest configuration
- **UI testing**: @testing-library/react for component tests

**Playwright**:

- **Browser extension support**: Can load unpacked extensions for testing
- **Multi-browser**: Test Chrome and Firefox with same tests
- **Auto-wait**: Reduces flaky tests (waits for elements)
- **TypeScript**: Native support
- **Screenshots**: Visual regression testing for UI

**Alternatives Considered**:

- **Jest**: Slower cold start, requires ts-jest configuration, ESM support issues
- **Cypress**: Less reliable for extensions, slower than Playwright
- **WebdriverIO**: More complex setup, overkill for plugin testing
- **Puppeteer**: Chrome-only, less reliable auto-waiting than Playwright

**Implementation Notes**:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      threshold: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
});
```

**Best Practices**:

- Mock chrome.storage API in unit tests
- Use MSW (Mock Service Worker) for LLM API mocking
- Playwright: Load extension from `dist/` after build
- Separate test commands: `test:unit`, `test:integration`, `test:e2e`

## LLM Provider Architecture

**Plugin System Design**:

```typescript
// src/services/llm/index.ts
export interface LLMProvider {
  readonly name: string;
  readonly requiresApiKey: boolean;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  validateConfig(config: ProviderConfig): Promise<boolean>;
}

export interface GenerationRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResponse {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

// Registry pattern
export class LLMRegistry {
  private providers = new Map<string, LLMProvider>();
  
  register(id: string, provider: LLMProvider): void;
  get(id: string): LLMProvider | undefined;
  list(): Array<{ id: string; name: string }>;
}
```

**Why this architecture**:

- Extensibility: Add new providers without modifying existing code
- Testability: Easy to mock providers in tests
- Type safety: Interface ensures all providers implement required methods
- User choice: Settings UI dynamically shows available providers

## Job Platform Extraction Architecture

**Plugin System Design**:

```typescript
// src/services/extraction/index.ts
export interface JobExtractor {
  readonly platformName: string;
  readonly urlPatterns: RegExp[];
  canExtract(url: string): boolean;
  extract(document: Document): Promise<JobDetails | null>;
}

export interface JobDetails {
  company: string;
  title: string;
  description: string;
  skills: string[];
  url: string;
}

// Registry pattern
export class ExtractorRegistry {
  private extractors: JobExtractor[] = [];
  
  register(extractor: JobExtractor): void;
  findExtractor(url: string): JobExtractor | undefined;
  extractFromPage(url: string, doc: Document): Promise<JobDetails | null>;
}
```

**Platform-Specific Extractors**:

**LinkedIn** (`platforms/linkedin.ts`):

- URL pattern: `/^https:\/\/(www\.)?linkedin\.com\/jobs\/view\//`
- Selectors:
  - Company: `.topcard__org-name-link`
  - Title: `.topcard__title`
  - Description: `.show-more-less-html__markup`
  - Skills: `.job-details-how-you-match__skills-item`

**Indeed** (`platforms/indeed.ts`):

- URL pattern: `/^https:\/\/(www\.)?indeed\.com\/viewjob/`
- Selectors:
  - Company: `.jobsearch-InlineCompanyRating`
  - Title: `.jobsearch-JobInfoHeader-title`
  - Description: `#jobDescriptionText`
  - Skills: Extract from description (no dedicated field)

**Glassdoor** (`platforms/glassdoor.ts`):

- URL pattern: `/^https:\/\/(www\.)?glassdoor\.com\/job-listing\//`
- Selectors:
  - Company: `.e1tk4kwz4`
  - Title: `.css-1vac5jk`
  - Description: `.desc`
  - Skills: Extract from description

**Fallback/Manual** (`platforms/manual.ts`):

- Always matches (lowest priority)
- Returns null, triggers manual input form

**Why this architecture**:

- Isolation: Each platform extractor independent, CSS changes affect only that platform
- Priority: Match most specific pattern first, fallback to manual
- Extensibility: Users could theoretically add custom extractors (future)
- Resilience: If one extractor breaks, others continue working

## Encryption Strategy

**Decision**: Use Web Crypto API (`crypto.subtle`) with AES-GCM

**Rationale**:

- Native browser API, no dependencies
- AES-GCM: Authenticated encryption (detects tampering)
- Key derivation: PBKDF2 from user's device ID + salt

**Implementation**:

```typescript
// src/services/storage/encryption.ts
export class StorageEncryption {
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  async encrypt(data: string, key: CryptoKey): Promise<string>;
  async decrypt(encrypted: string, key: CryptoKey): Promise<string>;
}
```

**What to encrypt**:

- User profile: email, phone (PII)
- LLM API keys (Gemini key)
- Generated cover letter cache (contains personal info)

**What NOT to encrypt**:

- Settings (UI preferences, selected provider)
- Usage metrics (anonymous counts)

## Prompt Engineering Strategy

**Template Structure**:

```typescript
interface PromptTemplate {
  system: string; // Role and context
  user: string;   // Specific request with interpolated data
}

const COVER_LETTER_TEMPLATE: PromptTemplate = {
  system: `You are a professional career advisor helping job seekers write effective cover letters. 
Your cover letters are:
- Personalized to the job and company
- Highlight relevant experience and skills
- Professional but conversational tone
- Structured in four sections: opening, about me, why me, why company
- 300-500 words total`,

  user: `Write a cover letter for this job application:

**Job Details:**
Company: {{company}}
Position: {{position}}
Description: {{description}}

**Candidate Profile:**
Name: {{name}}
Experience: {{experience}}
Skills: {{candidateSkills}}

**Custom Instructions (if provided):**
- Opening: {{openingInstruction || "Use standard professional greeting"}}
- About Me: {{aboutMeInstruction || "Introduce background naturally"}}
- Why Me: {{whyMeInstruction || "Highlight most relevant experience"}}
- Why Company: {{whyCompanyInstruction || "Show genuine interest in company"}}

Generate four sections following the user's custom instructions:
1. OPENING: Brief greeting and opening statement (1-2 sentences)
   {{#if openingInstruction}}Special instruction: {{openingInstruction}}{{/if}}
   
2. ABOUT_ME: Introduce yourself and your background (2-3 sentences)
   {{#if aboutMeInstruction}}Special instruction: {{aboutMeInstruction}}{{/if}}
   
3. WHY_ME: Explain why you're a great fit for this role, highlighting relevant experience and skills (3-4 sentences)
   {{#if whyMeInstruction}}Special instruction: {{whyMeInstruction}}{{/if}}
   
4. WHY_COMPANY: Explain why you're interested in this company/position specifically (2-3 sentences)
   {{#if whyCompanyInstruction}}Special instruction: {{whyCompanyInstruction}}{{/if}}

Format as JSON:
{
  "opening": "Dear Hiring Manager, ...",
  "about_me": "I am a ... with experience in ...",
  "why_me": "My background in ... makes me well-suited for this role because ...",
  "why_company": "I am particularly drawn to [Company] because ..."
}`
};
```

**Best Practices**:

- Use structured output (JSON) for reliable parsing
- Explicit length constraints (word counts per section)
- Tone guidance to maintain professionalism
- Incorporate user instructions when provided to personalize content
- Fallback: If JSON parsing fails, attempt to extract sections by pattern matching
- Provide addressee as "Hiring Manager" by default (user can edit)

**Instruction Examples**:

Users can provide short guidance like:
- Opening: "Mention that Jane Doe referred me"
- About Me: "Focus on my startup experience and product management background"
- Why Me: "Emphasize my leadership skills and team-building experience"
- Why Company: "Mention their recent AI research paper I read and their commitment to open source"

## Summary

All technical unknowns resolved:

- **PDF parsing**: pdfjs-dist (Mozilla PDF.js)
- **Ollama**: Direct HTTP API calls with fetch
- **Gemini**: @google/generative-ai SDK
- **Testing**: Vitest + Playwright
- **Architecture**: Plugin system for LLM providers and job extractors
- **Encryption**: Web Crypto API with AES-GCM
- **Prompting**: Structured templates with JSON output

Ready to proceed to **Phase 1: Design & Contracts**.
