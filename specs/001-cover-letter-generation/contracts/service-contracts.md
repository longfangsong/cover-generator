# Service Contracts: Core Cover Letter Generation

**Feature**: 001-cover-letter-generation  
**Date**: 2025-10-27  
**Purpose**: Define interfaces for internal services and external API integrations

## Internal Service Contracts

### LLM Provider Interface

All LLM provider implementations must implement this interface.

**TypeScript Interface**:

```typescript
interface LLMProvider {
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

interface GenerationRequest {
  prompt: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number; // milliseconds
}

interface GenerationResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'error';
}

interface ProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  availableModels?: string[];
}

class LLMError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK_ERROR' | 'INVALID_API_KEY' | 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_RESPONSE',
    public provider: string
  ) {
    super(message);
  }
}
```

**Implementations Required**:

- `OllamaProvider` (id: "ollama")
- `GeminiProvider` (id: "gemini")

**Usage Example**:

```typescript
const registry = new LLMRegistry();
registry.register('ollama', new OllamaProvider());
registry.register('gemini', new GeminiProvider());

const provider = registry.get('ollama');
const response = await provider.generate({
  prompt: 'Write a cover letter...',
  model: 'llama2',
  maxTokens: 1024,
  temperature: 0.7
});
```

### Job Extractor Interface

All job posting extractors must implement this interface.

**TypeScript Interface**:

```typescript
interface JobExtractor {
  /** Platform unique identifier */
  readonly id: string;
  
  /** Display name for UI */
  readonly name: string;
  
  /** URL patterns this extractor can handle */
  readonly urlPatterns: RegExp[];
  
  /**
   * Check if this extractor can handle the given URL
   */
  canExtract(url: string): boolean;
  
  /**
   * Extract job details from page DOM
   * @returns JobDetails or null if extraction fails
   */
  extract(document: Document): Promise<JobDetails | null>;
  
  /**
   * Validate extracted data
   * @returns true if all required fields present
   */
  validate(details: JobDetails): boolean;
}

interface JobDetails {
  url: string;
  company: string;
  title: string;
  description: string;
  skills: string[];
  platform: string;
  extractedAt: Date;
  isManual: boolean;
}

class ExtractionError extends Error {
  constructor(
    message: string,
    public platform: string,
    public url: string
  ) {
    super(message);
  }
}
```

**Implementations Required**:

- `LinkedInExtractor` (id: "linkedin")
- `IndeedExtractor` (id: "indeed")
- `GlassdoorExtractor` (id: "glassdoor")
- `ManualExtractor` (id: "manual", fallback)

**Usage Example**:

```typescript
const registry = new ExtractorRegistry();
registry.register(new LinkedInExtractor());
registry.register(new IndeedExtractor());
registry.register(new ManualExtractor()); // Always last (fallback)

const extractor = registry.findExtractor(currentUrl);
const jobDetails = await extractor.extract(document);
```

### Storage Service Interface

Abstraction over browser storage with encryption.

**TypeScript Interface**:

```typescript
interface StorageService {
  /**
   * Save user profile (encrypts sensitive fields)
   */
  saveProfile(profile: UserProfile): Promise<void>;
  
  /**
   * Load user profile (decrypts sensitive fields)
   */
  loadProfile(): Promise<UserProfile | null>;
  
  /**
   * Save generated cover letter (encrypted)
   */
  saveCoverLetter(letter: CoverLetterContent): Promise<void>;
  
  /**
   * Load cover letter by ID (decrypted)
   */
  loadCoverLetter(id: string): Promise<CoverLetterContent | null>;
  
  /**
   * List all cover letters for profile
   */
  listCoverLetters(profileId: string): Promise<CoverLetterContent[]>;
  
  /**
   * Delete cover letter
   */
  deleteCoverLetter(id: string): Promise<void>;
  
  /**
   * Save LLM provider config (encrypts API key)
   */
  saveProviderConfig(config: LLMProviderConfig): Promise<void>;
  
  /**
   * Load provider config (decrypts API key)
   */
  loadProviderConfig(): Promise<LLMProviderConfig | null>;
  
  /**
   * Cache job details (temporary)
   */
  cacheJobDetails(job: JobDetails): Promise<void>;
  
  /**
   * Get cached job details
   */
  getCachedJob(url: string): Promise<JobDetails | null>;
  
  /**
   * Clear all user data (export/delete flow)
   */
  clearAll(): Promise<void>;
  
  /**
   * Export all data as JSON
   */
  exportData(): Promise<string>;
}
```

**Implementation**: `BrowserStorageService` using `chrome.storage.local`

### PDF Service Interface

**TypeScript Interface**:

```typescript
interface PDFService {
  /**
   * Parse PDF and extract text content
   * @throws PDFError if parsing fails
   */
  parsePDF(file: File): Promise<PDFContent>;
  
  /**
   * Export cover letter as PDF
   * @throws PDFError if generation fails
   */
  exportToPDF(letter: CoverLetterContent, profile: UserProfile): Promise<Blob>;
}

interface PDFContent {
  text: string;
  pages: number;
  metadata?: {
    title?: string;
    author?: string;
  };
}

class PDFError extends Error {
  constructor(
    message: string,
    public code: 'PARSE_ERROR' | 'FILE_TOO_LARGE' | 'INVALID_FORMAT' | 'EXPORT_ERROR'
  ) {
    super(message);
  }
}
```

**Implementation**: `PDFJSService` (parsing) + remote API call (export)

## External API Contracts

### Ollama API

**Endpoint**: `http://localhost:11434/api/generate` (default, user-configurable)

**Request**:

```json
POST /api/generate
Content-Type: application/json

{
  "model": "llama2",
  "prompt": "Write a cover letter for...",
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 1024
  }
}
```

**Response** (Success):

```json
{
  "model": "llama2",
  "created_at": "2025-10-27T12:00:00Z",
  "response": "Dear Hiring Manager,\n\n...",
  "done": true,
  "context": [/* token IDs */],
  "total_duration": 5000000000,
  "load_duration": 1000000,
  "prompt_eval_count": 100,
  "eval_count": 250
}
```

**Response** (Error):

```json
{
  "error": "model not found"
}
```

**Health Check**:

```json
GET /api/tags
```

Returns list of available models.

**Error Handling**:

- Connection refused → "Cannot connect to Ollama. Is it running on localhost:11434?"
- Model not found → "Model 'llama2' not found. Available models: [list]"
- Timeout (30s) → "Ollama request timed out. Try a smaller model or increase timeout."

### Google Gemini API

**SDK**: `@google/generative-ai`

**Usage** (via SDK):

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const result = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [{ text: prompt }]
  }],
  generationConfig: {
    maxOutputTokens: 1024,
    temperature: 0.7
  }
});

const text = result.response.text();
```

**Error Handling**:

- Invalid API key (401) → "Invalid Gemini API key. Get one at https://makersuite.google.com"
- Rate limit (429) → "Gemini rate limit reached. Please wait and try again."
- Safety block → "Content was blocked by safety filters. Try rephrasing your profile."
- Quota exceeded (429) → "Gemini API quota exceeded. Check your usage at Google Cloud Console."

### PDF Export Service

**Remote Service API**: Backend service for generating professional PDF cover letters

**Request Contract**:

```typescript
interface PDFRenderRequest {
  first_name: string;
  last_name: string;
  email: string;
  homepage?: string;        // Optional personal website
  phone?: string;          // Optional phone number
  github?: string;         // Optional GitHub URL or username
  linkedin?: string;       // Optional LinkedIn URL
  position: string;        // Job position/title
  addressee: string;       // "Hiring Manager", company name, or contact name
  opening: string;         // Opening/greeting section
  about_me: string;        // Introduction and background
  why_me: string;          // Why candidate is a good fit
  why_company: string;     // Why this company/position
}
```

**API Endpoint**:

```http
POST /api/render-pdf
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "homepage": "https://johndoe.com",
  "phone": "+1-555-0100",
  "github": "johndoe",
  "linkedin": "https://linkedin.com/in/johndoe",
  "position": "Senior Software Engineer",
  "addressee": "Hiring Manager",
  "opening": "I am writing to express my interest...",
  "about_me": "With over 5 years of experience...",
  "why_me": "My background in distributed systems...",
  "why_company": "I am particularly drawn to your company's..."
}
```

**Response** (Success):

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="cover-letter.pdf"

[Binary PDF data]
```

**Response** (Error):

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid request",
  "details": "first_name is required"
}
```

**TypeScript Client Implementation**:

```typescript
async function exportToPDF(
  letter: CoverLetterContent,
  profile: UserProfile
): Promise<Blob> {
  const [firstName, ...lastNameParts] = profile.name.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;
  
  const request: PDFRenderRequest = {
    first_name: firstName,
    last_name: lastName,
    email: profile.email,
    homepage: profile.homepage,
    phone: profile.phone,
    github: profile.github,
    linkedin: profile.linkedin,
    position: letter.position,
    addressee: letter.addressee,
    opening: letter.opening,
    about_me: letter.aboutMe,
    why_me: letter.whyMe,
    why_company: letter.whyCompany
  };
  
  const response = await fetch('https://pdf-service.example.com/api/render-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new PDFError('PDF export failed', 'EXPORT_ERROR');
  }
  
  return await response.blob();
}
```

**Error Handling**:

- Network error → "Cannot connect to PDF service. Please try again or use copy-to-clipboard."
- Invalid request (400) → "Invalid cover letter data. Please check all fields are filled."
- Service unavailable (503) → "PDF service temporarily unavailable. Please try again later."
- Timeout (30s) → "PDF generation timed out. Please try again."

**Fallback**: If service unavailable, use browser print-to-PDF (via `window.print()`)

## Message Passing Contracts (Content Scripts ↔ Popup)

Browser extensions communicate via message passing.

**Message Types**:

```typescript
type Message =
  | { type: 'EXTRACT_JOB'; url: string }
  | { type: 'JOB_EXTRACTED'; data: JobDetails | null }
  | { type: 'EXTRACTION_ERROR'; error: string };

// Popup → Content Script
chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_JOB', url });

// Content Script → Popup
chrome.runtime.sendMessage({ type: 'JOB_EXTRACTED', data });
```

**Content Script Responsibility**:

- Listen for `EXTRACT_JOB` messages
- Query DOM using appropriate extractor
- Send `JOB_EXTRACTED` or `EXTRACTION_ERROR` response

**Popup Responsibility**:

- Send `EXTRACT_JOB` when user clicks plugin icon
- Handle `JOB_EXTRACTED` response and populate form
- Handle `EXTRACTION_ERROR` and show manual input fallback

## Rate Limiting Contract

**Client-Side Rate Limiter**:

```typescript
interface RateLimiter {
  /**
   * Check if request is allowed
   * @returns true if allowed, false if rate limited
   */
  allowRequest(userId: string): boolean;
  
  /**
   * Record a successful request
   */
  recordRequest(userId: string): void;
  
  /**
   * Get time until next request allowed (in seconds)
   */
  getTimeUntilReset(userId: string): number;
}

// Implementation: Sliding window (10 requests per 60 seconds)
class SlidingWindowRateLimiter implements RateLimiter {
  private windows = new Map<string, number[]>(); // userId → timestamps
  private readonly limit = 10;
  private readonly windowMs = 60000; // 60 seconds
  
  allowRequest(userId: string): boolean {
    const now = Date.now();
    const window = this.windows.get(userId) || [];
    const recent = window.filter(ts => now - ts < this.windowMs);
    return recent.length < this.limit;
  }
  
  recordRequest(userId: string): void {
    const now = Date.now();
    const window = this.windows.get(userId) || [];
    window.push(now);
    this.windows.set(userId, window.filter(ts => now - ts < this.windowMs));
  }
  
  getTimeUntilReset(userId: string): number {
    const window = this.windows.get(userId) || [];
    if (window.length === 0) return 0;
    const oldest = Math.min(...window);
    const resetTime = oldest + this.windowMs;
    return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
  }
}
```

## Summary

Defined contracts for:

1. **Internal Services**:
   - LLMProvider interface (Ollama, Gemini implementations)
   - JobExtractor interface (LinkedIn, Indeed, Glassdoor, Manual)
   - StorageService (encrypted browser storage)
   - PDFService (parse and export)

2. **External APIs**:
   - Ollama REST API (`/api/generate`)
   - Google Gemini SDK (`@google/generative-ai`)
   - PDF Export Service (TBD, fallback to print)

3. **Message Passing**:
   - Content Script ↔ Popup communication
   - Extract job details flow

4. **Rate Limiting**:
   - Sliding window implementation (10 req/min)

All contracts include error handling, validation, and type safety to ensure robustness and maintain constitution compliance.
