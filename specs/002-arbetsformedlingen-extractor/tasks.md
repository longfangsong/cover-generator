# Tasks: Arbetsförmedlingen Job Extractor

**Input**: Design documents from `/specs/002-arbetsformedlingen-extractor/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks included following Test-First Development (Constitution requirement IV)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths below use absolute paths from `/Users/longfangsong/Projects/cover-generator/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify TypeScript 5.6.3 configuration in tsconfig.json
- [x] T002 [P] Verify test environment configured in vitest.config.ts
- [x] T003 [P] Verify browser extension manifest permissions in src/manifest.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add ARBETSFORMEDLINGEN enum value to JobPlatform in src/models/JobDetails.ts
- [x] T005 Review existing JobExtractor interface in src/services/jobExtractor/index.ts (ideally no changes needed, familiarize with contract)
- [x] T006 Review ExtractorRegistry implementation in src/services/jobExtractor/registry.ts (ideally no changes needed, understand registration pattern)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Extract Job Details from Arbetsförmedlingen (Priority: P1) 🎯 MVP

**Goal**: Enable automatic extraction of job details (company, title, description, skills) from arbetsformedlingen.se job postings

**Independent Test**: Navigate to <https://arbetsformedlingen.se/platsbanken/annonser/30001375>, activate extension, verify all job details are extracted and displayed correctly

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Create test file tests/unit/extraction/ArbetsformedlingenExtractor.test.ts with basic structure
- [x] T008 [P] [US1] Write canExtract tests for URL pattern matching in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts
- [x] T009 [P] [US1] Write extract tests with mock DOM (success cases) in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts
- [x] T010 [P] [US1] Write extract tests for missing required fields (error cases) in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts
- [x] T011 [P] [US1] Write validate tests for JobDetails validation logic in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts
- [x] T012 [P] [US1] Create mock DOM helper function createMockArbetsformedlingenDOM in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts

**Checkpoint - Tests Complete**: All tests should FAIL at this point (Red phase of TDD)

### Implementation for User Story 1

- [x] T013 [US1] Create src/services/jobExtractor/platforms/arbetsformedlingen.ts with class skeleton and interface implementation
- [x] T014 [US1] Implement canExtract method with URL pattern regex in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T015 [US1] Implement extractCompany private method using selector h2#pb-company-name in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T016 [US1] Implement extractTitle private method using selector h1[data-read-assistance-title] in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T017 [US1] Implement extractDescription private method using selector .section.job-description in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T018 [US1] Implement extractSkills private method parsing lib-pb-feature-job-qualifications in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T019 [US1] Implement extract public method orchestrating all extraction logic in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T020 [US1] Implement validate method checking all JobDetails constraints in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T021 [US1] Add error handling with ExtractionError for missing required fields in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T022 [US1] Add console logging following LinkedInExtractor pattern in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T023 [US1] Register ArbetsformedlingenExtractor in ExtractorRegistry in src/services/jobExtractor/client.ts

**Checkpoint - Tests Passing**: All tests should now PASS (Green phase of TDD)

- [x] T024 [US1] Run unit tests and verify 80%+ coverage for ArbetsformedlingenExtractor
- [x] T025 [US1] Refactor extraction methods for better readability (Refactor phase of TDD)
- [x] T026 [US1] Manual browser test with real arbetsformedlingen.se job posting (<https://arbetsformedlingen.se/platsbanken/annonser/30001375>)

**Checkpoint**: At this point, User Story 1 should be fully functional - extraction works for standard job postings

---

## Phase 4: User Story 2 - Handle Extraction Failures Gracefully (Priority: P2)

**Goal**: Provide clear error messages and manual entry fallback when extraction fails (non-job pages, missing data, page structure changes)

**Independent Test**: Navigate to arbetsformedlingen.se homepage, attempt extraction, verify error message appears with manual entry option

### Tests for User Story 2

- [x] T027 [P] [US2] Write tests for non-job page detection in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts
- [x] T028 [P] [US2] Write tests for missing optional fields handling in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts
- [x] T029 [P] [US2] Write tests for validation failures with appropriate error messages in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts

**Checkpoint - Tests Complete**: All US2 tests should FAIL at this point

### Implementation for User Story 2

- [x] T030 [US2] Enhance canExtract to detect non-job pages (homepage, search results) in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T031 [US2] Add user-friendly error messages for each failure scenario in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T032 [US2] Ensure ExtractionError includes platform name and URL for debugging in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T033 [US2] Update extract method to handle missing optional fields gracefully (empty skills array) in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T034 [US2] Verify existing UI provides manual entry fallback on extraction failure (no code changes needed, validate behavior)

**Checkpoint - Tests Passing**: All US2 tests should now PASS

- [x] T035 [US2] Manual browser test on non-job pages (homepage, search results) to verify error messages
- [x] T036 [US2] Manual test of manual entry fallback flow

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - extraction succeeds when possible, fails gracefully otherwise

---

## Phase 5: User Story 3 - Support Multiple Arbetsförmedlingen URL Patterns (Priority: P3)

**Goal**: Handle various URL patterns (with/without www, query parameters, mobile versions) for comprehensive coverage

**Independent Test**: Test extraction with various URL formats: with www prefix, with query parameters (?ps=ams), verify all are recognized and extracted correctly

### Tests for User Story 3

- [x] T037 [P] [US3] Write tests for URL patterns with www prefix in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts
- [x] T038 [P] [US3] Write tests for URL patterns with query parameters in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts
- [x] T039 [P] [US3] Write tests for edge cases (trailing slashes, http vs https) in tests/unit/extraction/ArbetsformedlingenExtractor.test.ts

**Checkpoint - Tests Complete**: All US3 tests should FAIL at this point

### Implementation for User Story 3

- [x] T040 [US3] Update URL pattern regex to handle www optional prefix in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T041 [US3] Update URL pattern regex to ignore query parameters in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T042 [US3] Test regex against multiple URL patterns in canExtract method in src/services/jobExtractor/platforms/arbetsformedlingen.ts

**Checkpoint - Tests Passing**: All US3 tests should now PASS

- [x] T043 [US3] Manual browser test with various URL patterns to verify pattern matching

**Checkpoint**: All user stories should now be independently functional with comprehensive URL support

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T044 [P] Add JSDoc comments to all public methods in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T045 [P] Add JSDoc comments to private extraction methods in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T046 Review code against TypeScript strict mode requirements (no any types, proper type annotations)
- [x] T047 [P] Verify test coverage meets 80% threshold using pnpm test:coverage
- [x] T048 [P] Review selector stability and add comments about potential breakage points in src/services/jobExtractor/platforms/arbetsformedlingen.ts
- [x] T049 Run full test suite (pnpm test) and verify all tests pass
- [x] T050 Build extension (pnpm run build) and verify no TypeScript errors
- [x] T051 Load extension in browser and run through quickstart.md manual test scenarios
- [x] T052 [P] Update .github/copilot-instructions.md if needed (already updated via update-agent-context.sh)
- [x] T053 Code review preparation - ensure all checklist items complete
- [x] T054 Create PR description with testing evidence (screenshots, test output)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after User Story 1 complete - Builds on US1 extraction logic with error handling
- **User Story 3 (P3)**: Can start after User Story 1 complete - Extends US1 URL pattern matching

### Within Each User Story

1. **Tests First** (Red phase): Write all tests, ensure they FAIL
2. **Implementation** (Green phase): Implement until tests PASS
3. **Refactor**: Clean up code while keeping tests GREEN
4. **Manual Validation**: Browser testing with real URLs
5. **Checkpoint**: Story complete and independently testable

### Parallel Opportunities

**Setup Phase**:

- T002 and T003 can run in parallel

**Foundational Phase**:

- T004, T005, T006 can all run in parallel (different files)

**User Story 1 Tests**:

- T007, T008, T009, T010, T011, T012 can all run in parallel (writing different test suites)

**User Story 1 Implementation**:

- T013 must complete first (creates file)
- T014-T020 depend on T013 but can proceed sequentially
- T021-T022 can run in parallel (different concerns)

**User Story 2 Tests**:

- T027, T028, T029 can run in parallel

**User Story 3 Tests**:

- T037, T038, T039 can run in parallel

**Polish Phase**:

- T044, T045, T047, T048, T052 can all run in parallel (different files/concerns)

---

## Parallel Example: User Story 1

```bash
# Tests Phase (Parallel)
# Developer A writes URL pattern tests (T008)
# Developer B writes extraction tests (T009)  
# Developer C writes validation tests (T011)
# Developer D creates mock DOM helper (T012)

# Implementation Phase (Sequential within story)
git checkout -b feature/us1-extractor
# T013: Create file structure
# T014: URL pattern matching
# T015-T018: Extraction methods
# T019: Orchestration
# T020: Validation
# T021-T022: Error handling and logging (parallel)
# T023: Registration

# Validation
pnpm test  # T024
# T025: Refactor
# T026: Manual test
```

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Include**: User Story 1 only (Phase 3)

- Basic extraction from standard arbetsformedlingen.se job postings
- Core company, title, description, skills extraction
- Basic validation and error handling

**Delivers**:

- 95% extraction success rate on standard job pages
- Users can extract job details automatically
- Immediate value for Swedish job seekers

### Incremental Delivery

**Release 1 (MVP)**: User Story 1

- Deliver core extraction functionality
- Get user feedback on selector stability
- Monitor extraction success rate

**Release 2**: User Story 1 + User Story 2

- Add comprehensive error handling
- Provide better user experience on failures
- Reduce user frustration

**Release 3 (Full Feature)**: All user stories (US1 + US2 + US3)

- Handle all URL variations
- Production-ready for all scenarios
- Complete feature coverage

---

### Risk Mitigation

**High Risk**: Arbetsförmedlingen changes page structure

- **Mitigation**: Use semantic IDs (#pb-company-name) which are less likely to change
- **Mitigation**: Comprehensive test coverage to catch breakage early
- **Mitigation**: Fallback to manual entry maintains functionality

**Medium Risk**: Angular rendering timing issues

- **Mitigation**: Content script runs at document_idle (after Angular renders)
- **Mitigation**: Graceful failure with clear error messages

**Low Risk**: Test coverage below 80%

- **Mitigation**: TDD approach ensures tests written first
- **Mitigation**: Coverage validation in T047 before completion

---

## Task Summary

**Total Tasks**: 54

- Setup (Phase 1): 3 tasks
- Foundational (Phase 2): 3 tasks
- User Story 1 (Phase 3): 20 tasks (6 tests + 14 implementation)
- User Story 2 (Phase 4): 10 tasks (3 tests + 7 implementation)
- User Story 3 (Phase 5): 7 tasks (3 tests + 4 implementation)
- Polish (Phase 6): 11 tasks

**Parallel Opportunities Identified**: 22 tasks marked with [P]

**Independent Test Criteria**:

- **US1**: Extract from <https://arbetsformedlingen.se/platsbanken/annonser/30001375>
- **US2**: Attempt extraction on arbetsformedlingen.se homepage
- **US3**: Test with URLs containing www, query parameters

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 = 26 tasks (Setup + Foundation + US1)

**Format Validation**: ✅ All tasks follow checklist format with checkbox, ID, optional [P], optional [Story], description with file path
