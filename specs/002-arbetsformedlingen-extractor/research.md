# Research: Arbetsförmedlingen Job Extractor

**Date**: 2025-10-29  
**Feature**: Arbetsförmedlingen Job Extractor Implementation

## Overview

This document contains research findings for implementing job detail extraction from arbetsformedlingen.se. The research focuses on DOM structure analysis, selector identification, and best practices for robust extraction.

## DOM Structure Analysis

### Page Structure

Arbetsförmedlingen uses an Angular-based single-page application with the following characteristics:

- **Framework**: Angular (identified by `_ngcontent-ng-` attributes)
- **Rendering**: Client-side JavaScript rendering (requires fully rendered DOM)
- **URL Pattern**: `https://arbetsformedlingen.se/platsbanken/annonser/[JOB_ID]`

### Key Selectors Identified

Based on analysis of job posting ID 30001375 (Säljchef till Västra Götalands län):

#### 1. Job Title
**Selector**: `h1[data-read-assistance-title]`  
**Example Content**: "Säljchef till Västra Götalands län"  
**Location**: Inside `lib-pb-section-job-quick-info` component  
**Reliability**: High - semantic HTML with specific data attribute

#### 2. Company Name
**Selector**: `h2#pb-company-name`  
**Example Content**: "Eldorado A/S"  
**Location**: Inside `lib-pb-section-job-quick-info` component, after job title  
**Reliability**: High - unique ID attribute

#### 3. Job Role/Position
**Selector**: `h3#pb-job-role`  
**Example Content**: "Försäljningschef"  
**Location**: Inside `lib-pb-section-job-quick-info` component  
**Reliability**: High - unique ID attribute  
**Note**: This is sometimes different from the job title (more generic role)

#### 4. Job Location
**Selector**: `h3#pb-job-location`  
**Example Content**: "Kommun: Göteborg"  
**Location**: Inside `lib-pb-section-job-quick-info` component  
**Reliability**: High - unique ID attribute

#### 5. Job Description
**Selector**: `.section.job-description`  
**Parent Component**: `lib-feature-show-more` > `lib-pb-section-job-main-content`  
**Content**: Full HTML content including paragraphs, lists, and formatting  
**Reliability**: Medium-High - class-based selector  
**Note**: Contains rich formatting (p, ul, li, strong, em tags)

#### 6. Skills/Qualifications
**Selector**: `lib-pb-feature-job-qualifications`  
**Sub-sections**:
- `lib-pb-section-job-qualification` (multiple instances)
  - Each has a header (`h3.qualifications-header`)
  - Types: "Kompetenser" (Skills), "Språk" (Languages), "Körkort" (Driver's License)
  - Lists: `ul[aria-label="Meriterande"]` or `ul[aria-label="Krav"]`
  
**Example Content**:
- Skills: "Försäljningsvana, direktförsäljning konsument"
- Languages: "Svenska", "Engelska"
- License: "B"

**Reliability**: Medium - component-based structure

### Alternative Selectors (Fallback)

In case primary selectors fail, these alternatives can be used:

1. **Job Title Fallback**: `h1.spacing.break-title` (first h1 in main content)
2. **Company Fallback**: `.topcard__org-name-link`, `h2.spacing.break-title` (after title)
3. **Description Fallback**: `div[data-read-assistance] .section` (within main content area)

## URL Pattern Analysis

### Primary Pattern
```regex
^https?://(www\.)?arbetsformedlingen\.se/platsbanken/annonser/\d+
```

### Pattern Components
- Protocol: `http` or `https`
- Domain: `arbetsformedlingen.se` (with optional `www.`)
- Path: `/platsbanken/annonser/`
- Job ID: Numeric identifier (e.g., `30001375`)

### Query Parameters
- Optional tracking parameters (e.g., `?ps=ams`)
- Should be ignored for matching purposes

## Extraction Strategy

### Decision: Progressive Enhancement Approach

**Rationale**: Arbetsförmedlingen uses Angular with client-side rendering, so DOM extraction must handle:

1. **Fully Rendered Content**: Extension content scripts run after page load, ensuring Angular has rendered
2. **Semantic Selectors**: Use ID attributes where available (`pb-company-name`, `pb-job-role`, `pb-job-location`)
3. **Component-Based Structure**: Navigate Angular component hierarchy when needed
4. **Fallback Chain**: Multiple selector attempts for resilience

### Extraction Order

1. **Validate URL** - Check against URL pattern before attempting extraction
2. **Extract Required Fields** (fail if missing):
   - Company Name (required)
   - Job Title (required)
   - Job Description (required)
3. **Extract Optional Fields** (continue if missing):
   - Skills/Qualifications
   - Job Role (may differ from title)
   - Location
4. **Clean & Format**:
   - Trim whitespace
   - Preserve paragraph breaks in description
   - Convert HTML lists to plain text arrays for skills

## Comparison with LinkedIn Extractor

### Similarities
- Both use DOM-based extraction (no API calls)
- Both require selector-based approach
- Both have similar data model (company, title, description, skills)
- Both need validation logic

### Differences

| Aspect | LinkedIn | Arbetsförmedlingen |
|--------|----------|-------------------|
| Framework | React/custom | Angular |
| ID Attributes | Few/none | Many (`pb-*` prefix) |
| Description Format | HTML in specific container | HTML with rich formatting |
| Skills Location | Skill pills/badges | Structured qualification sections |
| Selector Stability | Low (frequent changes) | Medium-High (semantic IDs) |

## Best Practices Applied

### 1. Selector Specificity
**Decision**: Prefer ID selectors over class selectors  
**Rationale**: Arbetsförmedlingen uses semantic IDs (`pb-company-name`, `pb-job-role`) that are less likely to change than auto-generated Angular class names

### 2. Description Formatting
**Decision**: Preserve basic formatting (paragraphs, line breaks)  
**Rationale**: Job descriptions contain structured information (lists, sections) that provide context

**Implementation**:
- Convert `<p>` tags to paragraphs with double newlines
- Convert `<li>` items to lines with bullet points or dashes
- Strip Angular-specific attributes (`_ngcontent-*`)
- Preserve bold/emphasis for key information

### 3. Error Handling
**Decision**: Fail fast for required fields, graceful degradation for optional  
**Rationale**: Better to fall back to manual entry than provide incomplete data

### 4. Skills Extraction
**Decision**: Extract from structured qualification sections  
**Rationale**: Arbetsförmedlingen organizes qualifications by type (skills, languages, licenses) in distinct sections

**Approach**:
- Look for `lib-pb-feature-job-qualifications` component
- Find all `lib-pb-section-job-qualification` subsections
- Extract header type and list items
- Combine relevant qualifications (skip license/location details)

## Alternatives Considered

### Alternative 1: API-Based Extraction
**Rejected**: No public API available for job details. The site loads data client-side from internal APIs that require authentication/session tokens.

### Alternative 2: Scrape Search Results
**Rejected**: Out of scope. Feature spec focuses on extracting from individual job posting pages, not search functionality.

### Alternative 3: Use AI/LLM for Extraction
**Rejected**: Overcomplicated for structured content. DOM selectors are more reliable and performant than LLM parsing.

## Risks & Mitigation

### Risk 1: Angular Version Updates
**Impact**: Selector attributes may change  
**Mitigation**: 
- Use semantic IDs primarily (`pb-*` prefix)
- Maintain fallback selectors
- Include comprehensive test coverage with mock DOM structures
- Log extraction failures for monitoring

### Risk 2: Content Format Changes
**Impact**: New HTML structure in job descriptions  
**Mitigation**:
- Use flexible text extraction that handles nested elements
- Don't rely on specific HTML structure within description
- Test with various job postings during development

### Risk 3: Missing Optional Fields
**Impact**: Some jobs may lack skills/qualifications sections  
**Mitigation**:
- Make skills extraction optional
- Return empty array when qualification section absent
- Ensure validation passes with empty skills

## Testing Strategy

### Unit Tests Required

1. **URL Pattern Matching**:
   - Valid: `https://arbetsformedlingen.se/platsbanken/annonser/12345`
   - Valid with www: `https://www.arbetsformedlingen.se/platsbanken/annonser/12345`
   - Valid with query params: `https://arbetsformedlingen.se/platsbanken/annonser/12345?ps=ams`
   - Invalid: Other arbetsformedlingen.se pages

2. **Field Extraction**:
   - Extract company name from `#pb-company-name`
   - Extract job title from `h1[data-read-assistance-title]`
   - Extract description from `.section.job-description`
   - Extract skills from qualification sections

3. **Error Handling**:
   - Missing company name throws error
   - Missing job title throws error
   - Missing description throws error
   - Missing skills returns empty array

4. **Data Validation**:
   - Extracted data meets JobDetails constraints
   - Platform set to ARBETSFORMEDLINGEN
   - Timestamp and UUID generated correctly

### Mock DOM Structure

Tests should use JSDOM with realistic HTML snippets from actual arbetsformedlingen.se pages. See `30001375.html` for reference structure.

## Conclusion

The Arbetsförmedlingen extractor can be implemented reliably using DOM-based extraction with semantic ID selectors. The site's use of Angular with well-defined component structure and ID attributes provides better selector stability than many job sites. The extraction pattern will follow the existing LinkedIn extractor approach with adaptations for Arbetsförmedlingen's specific DOM structure.

### Key Takeaways

1. **Use ID selectors** (`#pb-company-name`, `#pb-job-role`) for primary extraction
2. **Component-based navigation** through Angular structure
3. **Structured qualification extraction** from dedicated sections
4. **Preserve description formatting** while cleaning Angular attributes
5. **Comprehensive test coverage** to catch selector changes early
