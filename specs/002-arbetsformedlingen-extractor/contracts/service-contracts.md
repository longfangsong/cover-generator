# Service Contracts: Arbetsförmedlingen Job Extractor

**Date**: 2025-10-29  
**Feature**: Arbetsförmedlingen Job Extractor

## Overview

This document defines the interface contracts for the Arbetsförmedlingen job extractor. The extractor implements the existing `JobExtractor` interface without modifications.

## JobExtractor Interface Contract

**File**: `src/services/jobExtractor/index.ts`

### Interface Definition

```typescript
export interface JobExtractor {
  /** Platform unique identifier */
  readonly id: string;
  
  /** Display name for UI */
  readonly name: string;
  
  /** URL patterns this extractor can handle */
  readonly urlPatterns: RegExp[];
  
  /**
   * Check if this extractor can handle the given URL
   * @param url - The URL to check
   * @returns true if this extractor can handle the URL
   */
  canExtract(url: string): boolean;
  
  /**
   * Extract job details from page DOM
   * @param document - The DOM document to extract from
   * @returns JobDetails or null if extraction fails
   * @throws ExtractionError if extraction fails with details
   */
  extract(document: Document): Promise<JobDetails | null>;
  
  /**
   * Validate extracted data
   * @param details - The JobDetails to validate
   * @returns true if all required fields present and valid
   */
  validate(details: JobDetails): boolean;
}
```

## Arbetsförmedlingen Extractor Implementation Contract

### Class: ArbetsformedlingenExtractor

**File**: `src/services/jobExtractor/platforms/arbetsformedlingen.ts`

#### Public Properties

```typescript
class ArbetsformedlingenExtractor implements JobExtractor {
  // Platform identifier
  readonly id: string = 'arbetsformedlingen';
  
  // Display name for UI
  readonly name: string = 'Arbetsförmedlingen';
  
  // URL patterns this extractor handles
  readonly urlPatterns: RegExp[] = [
    /^https?:\/\/(www\.)?arbetsformedlingen\.se\/platsbanken\/annonser\/\d+/
  ];
}
```

#### Public Methods

##### canExtract

```typescript
/**
 * Check if URL matches Arbetsförmedlingen job posting pattern
 * 
 * @param url - The URL to check
 * @returns true if URL matches arbetsformedlingen.se job posting pattern
 * 
 * @example
 * canExtract('https://arbetsformedlingen.se/platsbanken/annonser/12345') // true
 * canExtract('https://arbetsformedlingen.se/other-page') // false
 */
canExtract(url: string): boolean
```

**Preconditions**:
- `url` is a valid string

**Postconditions**:
- Returns `true` if URL matches any pattern in `urlPatterns`
- Returns `false` otherwise
- No side effects

**Test Cases**:
- Valid job URL: `https://arbetsformedlingen.se/platsbanken/annonser/12345` → `true`
- Valid with www: `https://www.arbetsformedlingen.se/platsbanken/annonser/12345` → `true`
- Valid with query params: `https://arbetsformedlingen.se/platsbanken/annonser/12345?ps=ams` → `true`
- Homepage: `https://arbetsformedlingen.se/` → `false`
- Search page: `https://arbetsformedlingen.se/platsbanken` → `false`
- Other site: `https://linkedin.com/jobs/view/123` → `false`

##### extract

```typescript
/**
 * Extract job details from Arbetsförmedlingen page
 * 
 * @param document - The DOM document to extract from (must be fully rendered)
 * @returns JobDetails object with extracted data
 * @throws ExtractionError if required fields cannot be extracted
 * 
 * @example
 * const details = await extractor.extract(document);
 * console.log(details.company); // "Eldorado A/S"
 */
async extract(document: Document): Promise<JobDetails | null>
```

**Preconditions**:
- `document` is a valid DOM Document object
- Page is fully rendered (Angular has completed rendering)
- URL matches Arbetsförmedlingen pattern

**Postconditions**:
- Returns `JobDetails` object if extraction succeeds
- Throws `ExtractionError` if company, title, or description missing
- Generated JobDetails has:
  - `id`: Valid UUID v4
  - `url`: Current page URL from `document.location.href`
  - `platform`: `JobPlatform.ARBETSFORMEDLINGEN`
  - `extractedAt`: Current timestamp
  - `isManual`: `false`
  - `skills`: Array (may be empty)

**Error Conditions**:
- Throws `ExtractionError` with message "Could not extract company name" if company not found
- Throws `ExtractionError` with message "Could not extract job title" if title not found
- Throws `ExtractionError` with message "Could not extract job description" if description not found
- Throws `ExtractionError` with message "Extracted data failed validation" if validation fails

##### validate

```typescript
/**
 * Validate extracted job details
 * 
 * @param details - The JobDetails object to validate
 * @returns true if all validation checks pass
 * 
 * @example
 * const isValid = extractor.validate(jobDetails);
 */
validate(details: JobDetails): boolean
```

**Preconditions**:
- `details` is a valid JobDetails object

**Postconditions**:
- Returns `true` if all checks pass:
  - `company` exists, 1-200 characters
  - `title` exists, 1-200 characters
  - `description` exists, 10-10000 characters
  - `url` exists
  - `platform === JobPlatform.ARBETSFORMEDLINGEN`
  - `skills` is an array
- Returns `false` otherwise
- No side effects

#### Private Methods

##### extractCompany

```typescript
/**
 * Extract company name from DOM
 * 
 * @param document - The DOM document
 * @returns Company name or null if not found
 */
private extractCompany(document: Document): string | null
```

**Selector Strategy**:
1. Primary: `h2#pb-company-name`
2. Fallback: (none - company is required)

**Returns**: Trimmed company name or `null`

##### extractTitle

```typescript
/**
 * Extract job title from DOM
 * 
 * @param document - The DOM document
 * @returns Job title or null if not found
 */
private extractTitle(document: Document): string | null
```

**Selector Strategy**:
1. Primary: `h1[data-read-assistance-title]`
2. Fallback: `h1.spacing.break-title` (first h1 in content)

**Returns**: Trimmed job title or `null`

##### extractDescription

```typescript
/**
 * Extract and format job description from DOM
 * 
 * @param document - The DOM document
 * @returns Formatted job description or null if not found
 */
private extractDescription(document: Document): string | null
```

**Selector Strategy**:
1. Primary: `.section.job-description`
2. Fallback: (none - description is required)

**Processing**:
- Clones element to avoid DOM modifications
- Replaces `<br>` with newlines
- Adds newlines after block elements
- Extracts text content
- Normalizes whitespace
- Limits consecutive newlines to 2

**Returns**: Formatted description text or `null`

##### extractSkills

```typescript
/**
 * Extract skills/qualifications from DOM
 * 
 * @param document - The DOM document
 * @returns Array of skills (may be empty)
 */
private extractSkills(document: Document): string[]
```

**Selector Strategy**:
1. Find `lib-pb-feature-job-qualifications` container
2. Find all `lib-pb-section-job-qualification` sections
3. For each section:
   - Check header text (`h3.qualifications-header`)
   - Include if header is "Kompetenser" or "Språk"
   - Extract all `<li>` elements within `<ul>`
4. Return deduplicated array

**Returns**: Array of skill strings (empty if no skills found)

## Integration Contract

### ExtractorRegistry Registration

**File**: `src/services/jobExtractor/client.ts`

#### Registration

```typescript
import { ArbetsformedlingenExtractor } from './platforms/arbetsformedlingen';

const registry = new ExtractorRegistry();
registry.register(new ArbetsformedlingenExtractor());
```

**Preconditions**:
- Registry is initialized
- Extractor instance is valid

**Postconditions**:
- Extractor is registered with ID 'arbetsformedlingen'
- Registry can find extractor for Arbetsförmedlingen URLs
- No existing extractor with same ID is overwritten

### Message Passing Contract

#### Content Script → Popup Communication

**Message Type**: `EXTRACT_JOB_DETAILS`

**Request**:

```typescript
{
  type: 'EXTRACT_JOB_DETAILS'
}
```

**Response (Success)**:

```typescript
{
  success: true,
  data: {
    id: string,              // UUID v4
    url: string,             // Current page URL
    company: string,         // Extracted company name
    title: string,           // Extracted job title
    description: string,     // Formatted description
    skills: string[],        // Extracted skills array
    platform: 'Arbetsförmedlingen',
    extractedAt: Date,       // Timestamp
    isManual: false
  }
}
```

**Response (Failure)**:

```typescript
{
  success: false,
  error: string  // Error message from ExtractionError
}
```

## Error Handling Contract

### ExtractionError

**File**: `src/services/jobExtractor/index.ts`

```typescript
class ExtractionError extends Error {
  constructor(
    message: string,
    public platform: string,
    public url: string
  )
}
```

**Error Scenarios**:

| Scenario | Error Message | Platform | URL |
|----------|--------------|----------|-----|
| URL doesn't match | "URL does not match Arbetsförmedlingen job posting pattern" | "Arbetsförmedlingen" | Current URL |
| Missing company | "Could not extract company name" | "Arbetsförmedlingen" | Current URL |
| Missing title | "Could not extract job title" | "Arbetsförmedlingen" | Current URL |
| Missing description | "Could not extract job description" | "Arbetsförmedlingen" | Current URL |
| Validation failed | "Extracted data failed validation" | "Arbetsförmedlingen" | Current URL |
| Generic error | "Extraction failed: [error message]" | "Arbetsförmedlingen" | Current URL |

## Testing Contract

### Test Coverage Requirements

**File**: `tests/unit/extraction/ArbetsformedlingenExtractor.test.ts`

#### Required Test Suites

1. **canExtract Suite**:
   - Valid URLs (with/without www, with query params)
   - Invalid URLs (other pages, other sites)
   - Edge cases (malformed URLs, empty strings)

2. **extract Suite**:
   - Successful extraction with all fields
   - Successful extraction with empty skills
   - Missing required fields (company, title, description)
   - Invalid data (too short, too long)
   - Validation failures

3. **validate Suite**:
   - Valid JobDetails object
   - Invalid company (empty, too long)
   - Invalid title (empty, too long)
   - Invalid description (too short, too long)
   - Wrong platform
   - Invalid skills type

4. **Private Method Extraction** (via integration tests):
   - Company extraction from various selectors
   - Title extraction with fallbacks
   - Description formatting and cleaning
   - Skills extraction from multiple sections

#### Mock DOM Requirements

Tests must use JSDOM with realistic HTML structure from actual arbetsformedlingen.se pages. Mock functions should provide:

```typescript
function createMockArbetsformedlingenDOM(data: {
  company: string;
  title: string;
  description: string;
  skills: string[];
}): Document
```

## Backwards Compatibility

### Guarantees

- **No Breaking Changes**: Existing extractors (LinkedIn, Manual) unaffected
- **Interface Compliance**: Implements existing `JobExtractor` interface
- **Registry Compatibility**: Works with existing `ExtractorRegistry`
- **Storage Compatibility**: Uses existing `JobDetails` model
- **UI Compatibility**: No UI changes required

### Version Compatibility

- **TypeScript**: 5.6.3+ (existing version)
- **Browser APIs**: No new permissions required
- **Storage Format**: Compatible with existing localStorage structure

## Summary

The Arbetsförmedlingen extractor:

- ✅ Implements `JobExtractor` interface without modifications
- ✅ Follows LinkedIn extractor pattern
- ✅ Provides comprehensive error handling
- ✅ Maintains backwards compatibility
- ✅ Includes detailed test coverage requirements
- ✅ Documents all public and private method contracts
