# Data Model: Core Cover Letter Generation

**Feature**: 001-cover-letter-generation  
**Date**: 2025-10-27  
**Purpose**: Define core entities, their relationships, and validation rules

## Entity Definitions

### UserProfile

Represents the job seeker's personal and professional information.

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | string (UUID) | Yes | UUID v4 | Unique identifier |
| `name` | string | Yes | 1-200 chars | Full name |
| `email` | string | Yes | Valid email format | Contact email (encrypted at rest) |
| `phone` | string | No | E.164 format optional | Contact phone (encrypted at rest) |
| `homepage` | string | No | Valid URL | Personal website/portfolio URL |
| `github` | string | No | Valid URL or username | GitHub profile URL or username |
| `linkedin` | string | No | Valid URL | LinkedIn profile URL |
| `experience` | Experience[] | Yes | Min 1 entry, Max 15 | Work history |
| `skills` | string[] | Yes | Min 1, Max 50, each 1-100 chars | Professional skills |
| `education` | Education[] | No | Max 10 | Educational background |
| `createdAt` | Date | Yes | ISO 8601 | Profile creation timestamp |
| `updatedAt` | Date | Yes | ISO 8601 | Last modification timestamp |

**Storage**: Browser local storage, encrypted fields: email, phone

**Relationships**:

- One UserProfile per browser (singleton pattern)
- Has many Experience entries
- Has many Education entries
- Has many Skills (simple string array)

### Experience

Represents a single work or project experience entry in the user's profile.

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | string (UUID) | Yes | UUID v4 | Unique identifier |
| `company` | string | Yes | 1-200 chars | Employer name |
| `role` | string | Yes | 1-200 chars | Job title/position |
| `startDate` | Date | Yes | ISO 8601, not future | Employment start date |
| `endDate` | Date | No | ISO 8601, after startDate | Employment end date (null = current) |
| `description` | string | Yes | 10-1000 words | Responsibilities and achievements |
| `skills` | string[] | No | Max 20 | Skills used in this role |

**Validation Rules**:

- `description`: Max 1000 words (split on whitespace, count non-empty)
- `endDate` must be after `startDate` if present
- Max 15 Experience entries per UserProfile

### Education

Represents educational credentials.

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | string (UUID) | Yes | UUID v4 | Unique identifier |
| `institution` | string | Yes | 1-200 chars | School/university name |
| `degree` | string | Yes | 1-200 chars | Degree type (e.g., "B.S. Computer Science") |
| `field` | string | No | 1-200 chars | Field of study |
| `startDate` | Date | No | ISO 8601 | Start date |
| `endDate` | Date | No | ISO 8601, after startDate | Graduation date (null = in progress) |

**Validation Rules**:

- Max 10 Education entries per UserProfile
- At least one of degree or field must be present

### JobDetails

Represents information extracted from a job posting.

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | string (UUID) | Yes | UUID v4 | Unique identifier |
| `url` | string | Yes | Valid URL | Job posting URL |
| `company` | string | Yes | 1-200 chars | Company name |
| `title` | string | Yes | 1-200 chars | Job title/position |
| `description` | string | Yes | 10-10000 chars | Full job description |
| `platform` | string | Yes | Enum | Source platform (LinkedIn, Indeed, Glassdoor, ...) |

**Storage**: Browser session storage (temporary) + cache in local storage for recent jobs

**Relationships**:

- One JobDetails per job posting URL (unique by URL)
- Used by CoverLetterGeneration to create letters

### CoverLetterContent

Represents a generated or edited cover letter.

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | string (UUID) | Yes | UUID v4 | Unique identifier |
| `profileId` | string (UUID) | Yes | References UserProfile.id | Associated user profile |
| `jobId` | string (UUID) | Yes | References JobDetails.id | Associated job details |
| `position` | string | Yes | 1-200 chars | Position being applied for (from JobDetails.title) |
| `addressee` | string | Yes | 1-200 chars | Addressee/company name (e.g., "Hiring Manager", company name) |
| `opening` | string | Yes | 50-1000 chars | Opening/greeting section |
| `aboutMe` | string | Yes | 100-2000 chars | About me section (introduction, background) |
| `whyMe` | string | Yes | 100-2000 chars | Why I'm a good fit (relevant experience, skills) |
| `whyCompany` | string | Yes | 100-2000 chars | Why this company/position (motivation, alignment) |
| `generatedAt` | Date | Yes | ISO 8601 | Initial generation timestamp |
| `editedAt` | Date | No | ISO 8601 | Last edit timestamp |
| `llmProvider` | string | Yes | Enum | Provider used (Ollama, Gemini) |
| `llmModel` | string | Yes | 1-100 chars | Model name (e.g., "llama2", "gemini-pro") |

**Storage**: Browser local storage, encrypted

**Relationships**:

- Belongs to one UserProfile
- Belongs to one JobDetails
- Many CoverLetterContent per UserProfile (history)

**State Transitions**:

```text
[Created] → [Generated] → [Edited] → [Exported]
```

- **Created**: Empty template, awaiting generation
- **Generated**: LLM has returned content (opening, aboutMe, whyMe, whyCompany), not yet edited
- **Edited**: User has modified at least one section
- **Exported**: User has exported to PDF or copied to clipboard

### LLMProviderConfig

Represents user's LLM provider settings.

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `providerId` | string | Yes | Enum: "ollama", "gemini" | Selected provider |
| `apiKey` | string | Conditional | 1-500 chars | API key (required for Gemini) (encrypted) |
| `endpoint` | string | Conditional | Valid URL | Custom endpoint (Ollama only, default: localhost:11434) |
| `model` | string | Yes | 1-100 chars | Model name (e.g., "llama2", "gemini-pro") |
| `temperature` | number | No | 0.0-2.0 | Generation temperature (default: 0.7) |
| `maxTokens` | number | No | 100-8192 | Max output tokens (default: 1024) |
| `updatedAt` | Date | Yes | ISO 8601 | Last configuration update |

**Storage**: Browser local storage, encrypted field: apiKey

**Validation Rules**:

- If `providerId === "gemini"`, `apiKey` is required
- If `providerId === "ollama"`, `endpoint` defaults to "http://localhost:11434"
- `temperature` must be between 0.0 and 2.0
- `maxTokens` must be positive integer

### CoverLetterPromptData

Represents the data needed to fill into the LLM prompt template for cover letter generation. This is not persisted - it's computed on-demand from UserProfile and JobDetails, optionally with user-provided instructions.

**Purpose**: Template variable container for LLM prompt construction

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userName` | string | Yes | User's full name |
| `userEmail` | string | Yes | User's contact email |
| `userPhone` | string | No | User's contact phone |
| `userEducation` | string | No | Formatted education summary |
| `userExperience` | string | Yes | Formatted work or project experience summary |
| `userSkills` | string | Yes | Comma-separated skills list |
| `jobCompany` | string | Yes | Target company name |
| `jobTitle` | string | Yes | Target position title |
| `jobDescription` | string | Yes | Full job posting description |
| `openingInstruction` | string | No | User's custom instruction for opening section (0-500 chars) |
| `aboutMeInstruction` | string | No | User's custom instruction for about me section (0-500 chars) |
| `whyMeInstruction` | string | No | User's custom instruction for why me section (0-500 chars) |
| `whyCompanyInstruction` | string | No | User's custom instruction for why company section (0-500 chars) |

**Usage**:

```typescript
// Construct from UserProfile + JobDetails + optional instructions
const promptData = buildPromptData(userProfile, jobDetails, {
  openingInstruction: "Keep it brief and professional",
  whyMeInstruction: "Emphasize my backend experience"
});

// Fill into template
const prompt = fillTemplate(COVER_LETTER_TEMPLATE, promptData);

// Send to LLM (via service contract interface)
const response = await llmProvider.generate({ prompt, model, ... });
```

**Storage**: Not persisted - ephemeral data structure for generation flow only

## Validation Rules Summary

### Cross-Entity Validation

1. **Profile Completeness for Generation**:
   - UserProfile must have: name, email, ≥1 experience entry, ≥1 skill
   - JobDetails must have: company, title, description

2. **Rate Limiting**:
   - Simple in-memory counter: max 10 generation requests per 60 seconds
   - Tracked in UI state, not persisted

3. **Cache Expiry**:
   - CoverLetterContent cached for 7 days
   - JobDetails cached for 30 days
   - Expired entries auto-deleted on app load

4. **Storage Limits**:
   - Max total storage: 10MB (browser limit varies)
   - If approaching limit, delete oldest CoverLetterContent entries

### Field-Level Validation

All string fields:

- Trim whitespace
- Reject empty strings where required
- Enforce character/word limits

All date fields:

- Must be valid ISO 8601 format
- Range checks where applicable (no future dates for past events)

All UUIDs:

- Must be valid UUID v4 format
- Generated via `crypto.randomUUID()`

## Relationships Diagram

```text
UserProfile (1) ──< (M) Experience
     │
     │ (1)
     │
     ├──< (M) Education
     │
     │ (1)
     │
     └──< (M) CoverLetterContent
              │
              │ (M)
              │
              └──> (1) JobDetails

LLMProviderConfig (1) ── (Singleton)

CoverLetterPromptData ── (Ephemeral, computed from UserProfile + JobDetails)
```

**Key**:

- `(1)`: One
- `(M)`: Many
- `──<`: One-to-many relationship
- `──>`: Many-to-one reference
- `──`: One-to-one or singleton

## Storage Strategy

### Browser Local Storage

**Encrypted**:

- UserProfile (email, phone fields)
- CoverLetterContent (entire record)
- LLMProviderConfig (apiKey field)

**Unencrypted**:

- Education entries (linked to UserProfile)
- Experience entries (linked to UserProfile)
- Skills (linked to UserProfile)
- UI Settings (theme, preferences)

### Session Storage

- Current JobDetails (cleared on browser close)
- Rate limit counter (generation requests per minute)
- UI state (current step, loading indicators)

### In-Memory Only

- CoverLetterPromptData (computed on-demand for LLM prompts)
- LLM response cache (per session, for retry logic)

## Migration Strategy

**Version 1.0.0** (Initial):

- No migration needed, fresh install

**Future Considerations**:

- Add schema version field to all entities
- Implement migration runner on app start
- Preserve user data across updates

## Summary

Data model defines 7 core entities:

1. **UserProfile**: User's career information (persisted, partially encrypted)
2. **Experience**: Job history entries (persisted, linked to UserProfile)
3. **Education**: Academic credentials (persisted, linked to UserProfile)
4. **JobDetails**: Extracted job posting data (cached temporarily)
5. **CoverLetterContent**: Generated cover letters (persisted, encrypted)
6. **LLMProviderConfig**: LLM service settings (persisted, API key encrypted)
7. **CoverLetterPromptData**: Ephemeral template data for LLM generation (computed, not persisted)

All persisted entities use UUID v4 for identification, include timestamps, and enforce strict validation rules to maintain data integrity and comply with constitution principles (privacy, limits, observability).
