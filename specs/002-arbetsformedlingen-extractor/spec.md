# Feature Specification: Arbetsförmedlingen Job Extractor

**Feature Branch**: `002-arbetsformedlingen-extractor`  
**Created**: 2025-10-29  
**Status**: Draft  
**Input**: User description: "Create a new extractor to support arbetsformedlingen.se"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extract Job Details from Arbetsförmedlingen (Priority: P1)

A Swedish job seeker visits a job posting on arbetsformedlingen.se and wants to use the cover letter generator. When they activate the extension on the job page, the system automatically extracts the job details (company name, job title, description, and relevant skills) from the page and populates the job details form, allowing them to proceed with cover letter generation.

**Why this priority**: This is the core functionality - without automatic extraction, users must manually enter all job details, eliminating the main value proposition of the feature. This is the MVP that delivers immediate value.

**Independent Test**: Can be fully tested by navigating to any arbetsformedlingen.se job posting URL, activating the extension, and verifying that job details are automatically extracted and displayed correctly.

**Acceptance Scenarios**:

1. **Given** a user is viewing a valid job posting on arbetsformedlingen.se, **When** they activate the extension, **Then** the system extracts and displays the company name, job title, and full job description
2. **Given** a job posting contains a skills section on arbetsformedlingen.se, **When** extraction occurs, **Then** the system extracts relevant skills as a list
3. **Given** extraction completes successfully, **When** the user views the job details form, **Then** all extracted fields are pre-populated and editable
4. **Given** the page URL is a valid arbetsformedlingen.se job posting, **When** extraction is attempted, **Then** the system recognizes the platform as "Arbetsförmedlingen"

---

### User Story 2 - Handle Extraction Failures Gracefully (Priority: P2)

When a user tries to extract job details from an arbetsformedlingen.se page that doesn't contain a job posting (such as the homepage or search results), or when required information is missing from the page, the system provides a clear error message and offers the option to manually enter job details instead.

**Why this priority**: Error handling ensures users can still proceed with their task even when automatic extraction fails. This prevents user frustration and provides a fallback path.

**Independent Test**: Can be fully tested by attempting extraction on non-job pages (homepage, search results, company profile pages) and verifying appropriate error messages appear with manual entry option.

**Acceptance Scenarios**:

1. **Given** a user is on the arbetsformedlingen.se homepage or search results page, **When** they attempt extraction, **Then** the system displays an error message indicating this is not a job posting page
2. **Given** extraction fails due to missing required fields, **When** the error occurs, **Then** the system offers a "Manual Entry" option to proceed
3. **Given** the page structure has changed and extraction fails, **When** the error occurs, **Then** the system logs the error details and displays a user-friendly message

---

### User Story 3 - Support Multiple Arbetsförmedlingen URL Patterns (Priority: P3)

Arbetsförmedlingen may have different URL patterns for job postings (e.g., direct job links, links from search results, mobile versions). The system recognizes and handles all common URL patterns for arbetsformedlingen.se job postings.

**Why this priority**: While important for comprehensive coverage, the primary URL pattern (P1) handles most cases. Additional patterns improve user experience but aren't critical for MVP.

**Independent Test**: Can be fully tested by collecting various arbetsformedlingen.se job posting URLs (desktop, mobile, different entry points) and verifying each is correctly identified and extracted.

**Acceptance Scenarios**:

1. **Given** a user visits a job posting via different URL patterns (search result click, direct link, mobile URL), **When** extraction is attempted, **Then** the system successfully identifies and extracts from all patterns
2. **Given** a URL contains query parameters or tracking identifiers, **When** pattern matching occurs, **Then** the system correctly identifies it as an arbetsformedlingen.se job posting

---

### Edge Cases

- What happens when arbetsformedlingen.se changes their page structure or HTML selectors?
- How does the system handle bilingual job postings (Swedish and English)?
- What if the job posting is missing optional fields like company name or skills section?
- How does extraction behave with special characters or formatting in job descriptions (bullet points, tables, etc.)?
- What happens if the page loads dynamically and content isn't immediately available?
- How does the system differentiate between a job posting and other arbetsformedlingen.se pages (company profiles, articles, etc.)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST recognize arbetsformedlingen.se job posting URLs using URL pattern matching
- **FR-002**: System MUST extract company name from arbetsformedlingen.se job posting pages
- **FR-003**: System MUST extract job title from arbetsformedlingen.se job posting pages
- **FR-004**: System MUST extract full job description text from arbetsformedlingen.se job posting pages
- **FR-005**: System MUST extract skills/requirements from arbetsformedlingen.se job postings when available
- **FR-006**: System MUST validate extracted data to ensure all required fields (company, title, description) are present and meet minimum length requirements
- **FR-007**: System MUST store the platform identifier as "Arbetsförmedlingen" for extracted jobs
- **FR-008**: System MUST store the extraction timestamp when job details are extracted
- **FR-009**: System MUST generate a unique identifier for each extracted job posting
- **FR-010**: System MUST preserve the original job posting URL with the extracted details
- **FR-011**: System MUST handle extraction failures by providing clear error messages to users
- **FR-012**: System MUST offer manual entry as a fallback when extraction fails
- **FR-013**: System MUST preserve formatting elements (paragraphs, line breaks) from the job description where possible
- **FR-014**: System MUST distinguish between job posting pages and other arbetsformedlingen.se pages (homepage, search results, company profiles)
- **FR-015**: System MUST follow the same JobExtractor interface pattern used by existing extractors (LinkedIn)

### Key Entities *(include if feature involves data)*

- **JobExtractor**: Component responsible for recognizing arbetsformedlingen.se URLs, extracting content from the DOM, and returning structured job details
- **JobDetails**: Structured data containing company name, job title, description, skills list, platform identifier ("Arbetsförmedlingen"), URL, extraction timestamp, and unique identifier
- **JobPlatform**: Enumeration that includes Arbetsförmedlingen as a supported platform alongside LinkedIn, Indeed, Glassdoor, and Manual entry

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully extract job details from 95% of arbetsformedlingen.se job posting pages on first attempt
- **SC-002**: Extraction completes within 2 seconds from page load for typical job postings
- **SC-003**: Extracted job descriptions maintain 100% of original text content (though formatting may be simplified)
- **SC-004**: When extraction fails, users receive a clear error message within 1 second and can access manual entry option
- **SC-005**: All extracted data passes validation checks (required fields present, character limits met) in 100% of successful extractions
- **SC-006**: System correctly identifies arbetsformedlingen.se job posting URLs vs non-job pages with 99% accuracy
