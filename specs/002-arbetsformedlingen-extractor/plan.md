# Implementation Plan: Arbetsförmedlingen Job Extractor

**Branch**: `002-arbetsformedlingen-extractor` | **Date**: 2025-10-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-arbetsformedlingen-extractor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add automatic job detail extraction support for arbetsformedlingen.se (Swedish Public Employment Service) to the browser extension. This feature will enable Swedish job seekers to automatically extract company name, job title, job description, and relevant skills from arbetsformedlingen.se job postings. The extractor will follow the existing JobExtractor interface pattern used by the LinkedIn extractor, ensuring consistent integration with the cover letter generation workflow.

## Technical Context

**Language/Version**: TypeScript 5.6.3, targeting ESNext  
**Primary Dependencies**: React 18.2.0, uuid 13.0.0, vite-plugin-web-extension 4.0.0  
**Storage**: Browser chrome.storage.local API for cached job details (encrypted)  
**Testing**: Vitest 4.0.3 (unit/integration), Playwright 1.56.1 (E2E), jsdom 27.0.1 (DOM testing)  
**Target Platform**: Browser Extension (Chrome/Firefox/Edge via Web Extensions API)  
**Project Type**: Single project - Browser extension with TypeScript  
**Performance Goals**: <2 seconds extraction time, <200ms UI response time  
**Constraints**: No external API calls for extraction (DOM-based only), must work offline for extraction logic, strict TypeScript mode enforced  
**Scale/Scope**: Single new extractor class (~200-300 LOC), 1 new test file (~200 LOC), minimal changes to existing registry (~3 LOC)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User Privacy & Data Security ✅

- **Status**: COMPLIANT
- **Analysis**: This feature extracts job data from public job posting pages only. No new data storage mechanisms are introduced. Existing privacy controls (browser storage, encryption) remain in place. The extraction happens entirely client-side via DOM parsing with no external API calls.
- **Action**: None required

### II. LLM-Powered Content Generation Excellence ✅

- **Status**: COMPLIANT
- **Analysis**: This feature enhances the existing job extraction capability by adding support for a new job platform. It improves the quality of context provided to the LLM by expanding the range of job postings that can be automatically extracted (reducing manual entry errors).
- **Action**: None required

### III. Seamless Browser Integration & Non-Intrusive UX ✅

- **Status**: COMPLIANT
- **Analysis**: The new extractor follows the existing pattern. DOM extraction is fast (<2s), no new UI elements required, graceful fallback to manual entry on failure. No additional browser permissions needed.
- **Action**: None required

### IV. Test-First Development ✅

- **Status**: COMPLIANT
- **Analysis**: Test file will be created following the existing LinkedInExtractor test pattern. Unit tests for URL pattern matching, DOM extraction, validation, and error handling. Coverage thresholds (80%) must be met.
- **Action**: Create comprehensive test suite before implementation

### V. Clear Data Flow & Observability ✅

- **Status**: COMPLIANT
- **Analysis**: Extractor will use the same console logging pattern as LinkedInExtractor. No sensitive data logged. Errors are user-friendly and routed through existing error handling.
- **Action**: Follow existing logging conventions

### Security & Compliance Requirements ✅

- **Status**: COMPLIANT
- **Analysis**: No new storage, no new API keys, no new browser permissions required. DOM parsing only from the active tab (already has permission).
- **Action**: None required

### Development Workflow & Quality Gates ✅

- **Status**: COMPLIANT
- **Analysis**: Feature branch created, TypeScript strict mode enforced, test coverage thresholds configured, existing CI/CD pipeline applies.
- **Action**: None required

**Overall Status**: ✅ **PASS** - All constitutional requirements met. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-arbetsformedlingen-extractor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Arbetsförmedlingen DOM structure research
├── data-model.md        # Phase 1 output - JobDetails model (reuses existing)
├── quickstart.md        # Phase 1 output - Quick testing guide
├── contracts/           # Phase 1 output - JobExtractor interface contract
│   └── service-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/
│   └── JobDetails.ts                      # [MODIFY] Add ARBETSFORMEDLINGEN to JobPlatform enum
├── services/
│   └── jobExtractor/
│       ├── index.ts                       # [NO CHANGE] Interface definition
│       ├── client.ts                      # [MODIFY] Register ArbetsformedlingenExtractor
│       ├── registry.ts                    # [NO CHANGE] Registry logic
│       └── platforms/
│           ├── linkedin.ts                # [NO CHANGE] Existing extractor
│           ├── manual.ts                  # [NO CHANGE] Manual fallback
│           └── arbetsformedlingen.ts      # [NEW] Arbetsförmedlingen extractor implementation
└── content/
    └── job-extraction.ts                  # [NO CHANGE] Content script entry

tests/
├── unit/
│   └── extraction/
│       ├── LinkedInExtractor.test.ts      # [NO CHANGE] Existing tests
│       └── ArbetsformedlingenExtractor.test.ts  # [NEW] New extractor tests
└── setup.ts                               # [NO CHANGE] Test setup
```

**Structure Decision**: This is a single-project browser extension. All code resides in `src/` with standard separation: `models/` for data types, `services/` for business logic, `content/` for content scripts. Tests mirror the source structure in `tests/unit/` and `tests/integration/`. This follows the existing pattern established by the LinkedIn extractor.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified - this section is not applicable.
