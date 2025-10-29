# Implementation Plan: Core Cover Letter Generation

**Branch**: `001-cover-letter-generation` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-cover-letter-generation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements the core functionality of the cover letter generator browser plugin. Users can create profiles manually or via PDF upload (with AI extraction), browse job postings where the plugin auto-extracts job details, generate customized cover letters using AI (supporting Ollama and Gemini providers), and export results as formatted text or PDF. The system uses a plugin-based architecture for LLM providers and job site extractors to support extensibility.

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 18.2.0

**Primary Dependencies**:

- React 18.2.0 + React DOM for UI components
- webextension-polyfill 0.10.0 for cross-browser compatibility
- vite-plugin-web-extension 4.0.0 for building browser extension
- NEEDS CLARIFICATION: PDF parsing library (pdf.js, pdfjs-dist, or similar)
- NEEDS CLARIFICATION: Ollama SDK/client library for local LLM integration
- NEEDS CLARIFICATION: Google Generative AI SDK for Gemini integration

**Storage**: Browser local storage (encrypted) via `chrome.storage.local` API for user profiles, settings, and cached data

**Testing**: NEEDS CLARIFICATION: Testing framework (Vitest, Jest, or similar) + Playwright/Cypress for browser extension E2E tests

**Target Platform**: Browser extensions for Chrome/Firefox (Manifest V3)

**Project Type**: Single browser extension project with popup UI and content scripts

**Performance Goals**:

- Popup opens in <200ms
- AI generation completes in <10 seconds (90th percentile)
- Job extraction completes in <2 seconds
- PDF export completes in <5 seconds

**Constraints**:

- Must work entirely client-side except for AI API calls and PDF generation
- Maximum 5MB PDF uploads
- Profile field limits: 1000 words/entry, 15 max entries, 50 max skills
- Client-side rate limiting: max 10 LLM requests/minute
- Strict TypeScript mode enforced (no `any` types without justification)

**Scale/Scope**:

- Single-user local usage (no backend user management)
- Support 2 LLM providers initially (Ollama, Gemini)
- Support 1 job platform initially (LinkedIn)
- Extensible plugin architecture for adding more providers/platforms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User Privacy & Data Security (NON-NEGOTIABLE)

- [x] **Minimal data storage**: Profile data stored locally only, user controls all saves
- [x] **No third-party transmission without consent**: LLM calls only when user clicks "Generate"
- [x] **Clear disclosure**: UI will show which LLM service data is sent to before generation
- [x] **Local-first operation**: Profile viewing, editing, and cached letter viewing work offline
- [x] **Encryption at rest**: Browser storage encryption for sensitive fields (email, phone, API keys)
- [x] **Data usage controls**: Users can export/delete their data from settings

**Status**: ✅ PASS - All privacy requirements addressed in design

### II. LLM-Powered Content Generation Excellence

- [x] **Structured inputs**: Profile form captures name, skills, experience, education
- [x] **Automatic extraction**: Content scripts extract job details from supported platforms
- [x] **Well-formed prompts**: Prompt engineering module formats context for LLM
- [x] **Iterative refinement**: Users can edit generated content and regenerate
- [x] **Multiple LLM backends**: Plugin architecture supports Ollama and Gemini initially
- [x] **Response caching**: Cache LLM responses per job posting to avoid redundant calls

**Status**: ✅ PASS - LLM integration excellence maintained with extensible architecture

### III. Seamless Browser Integration & Non-Intrusive UX

- [x] **Fast popup launch**: Target <200ms load time (performance goal tracked)
- [x] **Platform detection**: Content scripts detect LinkedIn, Indeed, Glassdoor
- [x] **Inline editing**: All extracted fields editable before generation
- [x] **One-click copy**: Copy-to-clipboard functionality for generated letters
- [x] **Secure storage**: API keys encrypted in browser storage
- [x] **Graceful degradation**: Offline mode for viewing profiles and cached letters

**Status**: ✅ PASS - Browser UX principles followed

### IV. Test-First Development (Mandatory)

- [x] **Unit tests**: LLM integration, prompt formatting, data extraction logic
- [x] **Integration tests**: Plugin ↔ job site interactions with mocked responses
- [x] **UI tests**: Playwright/Cypress for popup flows, form submission, clipboard
- [x] **Red-Green-Refactor**: TDD cycle enforced (tracked in tasks phase)
- [x] **Acceptance tests**: All spec acceptance scenarios converted to passing tests

**Status**: ✅ PASS - Test strategy covers all required areas (specific framework TBD in research)

### V. Clear Data Flow & Observability

- [x] **Structured logging**: Console logging for all API calls (LLM, PDF export)
- [x] **No sensitive data in logs**: Use placeholders like `[USER_NAME]`, `[JOB_TITLE]`
- [x] **User-friendly errors**: Custom error messages for network, LLM, PDF failures
- [x] **Usage metrics**: Dashboard showing calls/day, success rate (in settings)
- [x] **Explanatory comments**: All data handling includes "why" not just "how"

**Status**: ✅ PASS - Observability and transparency built into design

### Security & Compliance

- [x] **API key encryption**: Browser storage encryption for LLM API keys
- [x] **Rate limiting**: Client-side limit of 10 requests/minute
- [x] **Minimal permissions**: Request only `activeTab`, `scripting`, `storage`
- [x] **Dependency audit**: Quarterly review (tracked in governance)

**Status**: ✅ PASS - Security requirements met

### Development Workflow & Quality Gates

- [x] **TypeScript strict mode**: Enforced in tsconfig.json
- [x] **Test coverage >80%**: Tracked in CI (framework TBD)
- [x] **No hardcoded secrets**: API keys from user settings only
- [x] **Build passes**: Zero broken builds in main

**Status**: ✅ PASS - Quality gates established

**Overall Gate Status**: ✅ ALL CHECKS PASSED - Proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/              # Data models for Profile, JobDetails, CoverLetter
├── services/
│   ├── llm/            # LLM provider abstraction and implementations
│   │   ├── providers/  # Ollama, Gemini provider implementations
│   │   └── index.ts    # LLM service interface
│   ├── extraction/     # Job site extraction plugins
│   │   ├── platforms/  # LinkedIn, Indeed, Glassdoor extractors
│   │   └── index.ts    # Extractor registry
│   ├── storage/        # Browser storage wrapper with encryption
│   ├── pdf/            # PDF parsing and export services
│   └── validation/     # Field validation and limits
├── components/         # React components for popup UI
│   ├── profile/        # Profile form components
│   ├── generation/     # Cover letter generation UI
│   └── settings/       # Settings panel
├── content/            # Content scripts for job site extraction
├── background.ts       # Background service worker
├── popup.tsx           # Main popup entry point
└── manifest.json       # Extension manifest

tests/
├── unit/               # Unit tests for services and models
├── integration/        # Integration tests for LLM and extraction
└── e2e/               # Playwright/Cypress browser tests

public/
└── icon/              # Extension icons
```

**Structure Decision**: Single browser extension project structure. The `src/` directory contains all extension code organized by concern: models for data structures, services for business logic (LLM, extraction, storage), components for React UI, and content scripts for page interaction. Tests are organized by type (unit, integration, e2e) to support the test-first development principle.

## Complexity Tracking

> **No violations - all constitution checks passed**

No complexity tracking required. The design adheres to all constitution principles without requiring justifications.

## Phase 0: Research Complete ✅

**Completed**: 2025-10-27

**Decisions Made**:

1. **PDF Parsing**: pdfjs-dist (Mozilla PDF.js 4.0+)
2. **Ollama Integration**: Direct HTTP API calls with fetch
3. **Gemini Integration**: @google/generative-ai SDK 0.1.3+
4. **Testing**: Vitest (unit/integration) + Playwright (E2E)
5. **Architecture**: Plugin system for LLM providers and job extractors
6. **Encryption**: Web Crypto API with AES-GCM

**Output**: `research.md` with all technical unknowns resolved

## Phase 1: Design & Contracts Complete ✅

**Completed**: 2025-10-27

**Artifacts Created**:

1. **data-model.md**: 7 core entities defined (UserProfile, WorkExperience, Education, JobDetails, CoverLetterContent, LLMProviderConfig, GenerationRequest)
2. **contracts/service-contracts.md**: Internal service interfaces (LLMProvider, JobExtractor, StorageService, PDFService) and external API contracts (Ollama, Gemini, PDF export)
3. **quickstart.md**: Developer onboarding guide with setup instructions, testing procedures, and common tasks
4. **Agent context updated**: GitHub Copilot context file updated with TypeScript 5.6.3, React 18.2.0, and browser storage technologies

**Key Design Decisions**:

- Plugin architecture for extensibility (LLM providers, job extractors)
- Encryption for sensitive data (email, phone, API keys, cover letters)
- Rate limiting (10 requests/minute) enforced client-side
- Offline capability for viewing cached data
- Three-section cover letter structure (opening, body, closing)

## Constitution Re-Check (Post-Design) ✅

All constitution principles remain satisfied after detailed design:

### Privacy & Security

- ✅ Encryption implemented via Web Crypto API (AES-GCM)
- ✅ Local storage only, no third-party transmission without consent
- ✅ Clear LLM provider disclosure in UI
- ✅ Data export/delete functionality planned

### LLM Excellence

- ✅ Plugin architecture supports Ollama and Gemini with extensibility
- ✅ Structured prompts with JSON output for reliability
- ✅ Response caching to avoid redundant calls
- ✅ Iterative refinement via inline editing

### Browser Integration

- ✅ Performance targets defined (<200ms popup, <10s generation)
- ✅ Platform-specific extractors (LinkedIn, Indeed, Glassdoor)
- ✅ Manual fallback for unsupported sites
- ✅ Graceful degradation for offline mode

### Test-First Development

- ✅ Testing framework selected (Vitest + Playwright)
- ✅ Test structure defined (unit, integration, E2E)
- ✅ Coverage thresholds set (80% minimum)
- ✅ MSW for API mocking, chrome API mocks in setup

### Observability

- ✅ Structured logging planned (console.log with no PII)
- ✅ Error messages user-friendly (not technical)
- ✅ Usage dashboard for transparency
- ✅ Rate limiter tracks request history

**Overall Status**: ✅ ALL PRINCIPLES MAINTAINED - Ready for Phase 2 (Tasks)

## Next Steps

**Command**: `/speckit.tasks` to generate tasks.md

**What's Next**:

1. Generate detailed task list organized by user story (P1, P2)
2. Implement features test-first (Red-Green-Refactor)
3. Start with P1 user stories (Manual Profile, Job Extraction, AI Generation)
4. Iterate through P2 features (PDF Upload, PDF Export)

**Branch**: `001-cover-letter-generation` (already checked out)

**Documentation Ready**:

- ✅ spec.md (requirements, user stories, success criteria)
- ✅ plan.md (this file - technical context, architecture)
- ✅ research.md (technology selections, best practices)
- ✅ data-model.md (entities, relationships, validation)
- ✅ contracts/service-contracts.md (interfaces, APIs)
- ✅ quickstart.md (developer setup, testing guide)
