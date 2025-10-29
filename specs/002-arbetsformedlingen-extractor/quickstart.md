# Quickstart Guide: Arbetsförmedlingen Job Extractor

**Date**: 2025-10-29  
**Feature**: Testing and validating the Arbetsförmedlingen job extractor

## Overview

This guide provides quick instructions for developers to test and validate the Arbetsförmedlingen job extractor implementation.

## Prerequisites

- ✅ Node.js installed (v18 or later)
- ✅ pnpm installed
- ✅ Repository cloned
- ✅ Dependencies installed (`pnpm install`)
- ✅ Feature branch checked out (`002-arbetsformedlingen-extractor`)

## Quick Test Run

### 1. Run Unit Tests

```bash
# Run all tests
pnpm test

# Run only extractor tests
pnpm test -- tests/unit/extraction/ArbetsformedlingenExtractor.test.ts

# Run with coverage
pnpm test:coverage
```

**Expected Output**:
- All test suites pass
- Coverage >80% for new files
- No type errors

### 2. Build the Extension

```bash
# Build for development
pnpm run dev

# Build for production
pnpm run build
```

**Expected Output**:
- No TypeScript errors
- Build completes successfully
- Extension files in `dist/` directory

### 3. Load in Browser (Manual Testing)

#### Chrome/Edge

1. Open Chrome/Edge
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist/` folder from your project
6. Extension icon appears in toolbar

#### Test URLs

Visit these Arbetsförmedlingen job postings to test extraction:

- **Test Job 1**: `https://arbetsformedlingen.se/platsbanken/annonser/30001375`
  - Expected: Säljchef position, Eldorado A/S
- **Test Job 2**: Any current job posting from `https://arbetsformedlingen.se/platsbanken`
  - Browse and find an active posting

#### Test Procedure

1. Navigate to an Arbetsförmedlingen job posting
2. Click the extension icon
3. Click "Extract Job Details" or equivalent button
4. Verify extracted data:
   - ✅ Company name populated
   - ✅ Job title populated
   - ✅ Description contains full text
   - ✅ Skills array populated (if available)
   - ✅ Platform shows "Arbetsförmedlingen"

### 4. Test Error Handling

#### Non-Job Page Test

1. Navigate to `https://arbetsformedlingen.se` (homepage)
2. Click extension icon
3. Try to extract

**Expected**: Error message indicating this is not a job posting page

#### Manual Entry Fallback

1. If extraction fails, manual entry form should appear
2. Verify you can still enter job details manually

## Development Workflow

### File Structure

```text
src/services/jobExtractor/
├── platforms/
│   ├── linkedin.ts              # Existing
│   ├── manual.ts                # Existing
│   └── arbetsformedlingen.ts    # NEW - Implement here
├── index.ts                     # Interface definition
├── client.ts                    # Registration (modify)
└── registry.ts                  # No changes

src/models/
└── JobDetails.ts                # Add enum value

tests/unit/extraction/
├── LinkedInExtractor.test.ts    # Reference for patterns
└── ArbetsformedlingenExtractor.test.ts  # NEW - Tests here
```

### Implementation Checklist

- [ ] Add `ARBETSFORMEDLINGEN` to `JobPlatform` enum in `src/models/JobDetails.ts`
- [ ] Create `src/services/jobExtractor/platforms/arbetsformedlingen.ts`
- [ ] Implement `ArbetsformedlingenExtractor` class
- [ ] Register extractor in `src/services/jobExtractor/client.ts`
- [ ] Create test file `tests/unit/extraction/ArbetsformedlingenExtractor.test.ts`
- [ ] Write test cases (URL matching, extraction, validation)
- [ ] Run tests and verify coverage
- [ ] Manual browser testing
- [ ] Update this checklist

## Testing Patterns

### Mock DOM Helper

Reference the LinkedIn extractor test for the pattern:

```typescript
function createMockArbetsformedlingenDOM(data: {
  company: string;
  title: string;
  description: string;
  skills: string[];
}): Document {
  // Create JSDOM document with Arbetsförmedlingen structure
  // Use actual HTML from research.md as template
}
```

### Test Case Template

```typescript
describe('ArbetsformedlingenExtractor', () => {
  let extractor: ArbetsformedlingenExtractor;

  beforeEach(() => {
    extractor = new ArbetsformedlingenExtractor();
  });

  describe('canExtract', () => {
    it('should match Arbetsförmedlingen job URLs', () => {
      expect(extractor.canExtract('https://arbetsformedlingen.se/platsbanken/annonser/12345')).toBe(true);
    });
  });

  describe('extract', () => {
    it('should extract complete job details', async () => {
      const mockDocument = createMockArbetsformedlingenDOM({
        company: 'Test Company AB',
        title: 'Software Developer',
        description: 'Great opportunity to work with us...',
        skills: ['JavaScript', 'TypeScript'],
      });

      const result = await extractor.extract(mockDocument);
      
      expect(result).not.toBeNull();
      expect(result?.company).toBe('Test Company AB');
      expect(result?.title).toBe('Software Developer');
      expect(result?.description).toContain('Great opportunity');
      expect(result?.skills).toEqual(['JavaScript', 'TypeScript']);
      expect(result?.platform).toBe(JobPlatform.ARBETSFORMEDLINGEN);
    });
  });
});
```

## Debugging Tips

### Console Logging

The content script logs extraction attempts:

```javascript
console.log('[Content Script] Attempting extraction from:', currentUrl);
console.log('[Content Script] Using extractor:', extractor.name);
console.log('[Content Script] Successfully extracted:', jobDetails);
```

Check browser console (F12) when testing.

### Common Issues

#### Issue: "No suitable extractor found"

- **Cause**: URL doesn't match pattern
- **Fix**: Verify URL pattern regex in `urlPatterns`
- **Check**: `canExtract()` returns true for the URL

#### Issue: "Could not extract [field]"

- **Cause**: Selector not finding element
- **Fix**: Inspect page, verify selector still valid
- **Check**: Run selector in browser console: `document.querySelector('#pb-company-name')`

#### Issue: Extraction works in tests but not in browser

- **Cause**: Timing issue - Angular not finished rendering
- **Fix**: Ensure content script runs after page load
- **Check**: `manifest.json` run_at: `document_idle`

## Performance Validation

### Metrics to Check

- **Extraction Time**: <2 seconds (measured in console)
- **Bundle Size**: <10KB increase in extension size
- **Memory**: No leaks after repeated extractions

### Performance Test

```bash
# Run performance test
pnpm test -- tests/unit/extraction/ArbetsformedlingenExtractor.test.ts --reporter=verbose
```

Look for slow tests (>100ms warns, >500ms fails).

## Next Steps

After completing quick testing:

1. **Code Review**: Submit PR for review
2. **E2E Tests**: Consider adding Playwright tests
3. **Documentation**: Update user-facing docs if needed
4. **Release**: Tag and release when approved

## Reference Files

- **Research**: `specs/002-arbetsformedlingen-extractor/research.md`
- **Data Model**: `specs/002-arbetsformedlingen-extractor/data-model.md`
- **Contracts**: `specs/002-arbetsformedlingen-extractor/contracts/service-contracts.md`
- **Plan**: `specs/002-arbetsformedlingen-extractor/plan.md`

## Support

If you encounter issues:

1. Check research.md for selector details
2. Check contracts/service-contracts.md for interface requirements
3. Compare with LinkedInExtractor implementation
4. Review test output for specific failures

## Quick Reference Commands

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Check coverage
pnpm test:coverage

# Build extension
pnpm run build

# Development mode (watch)
pnpm run dev

# Type check
pnpm run build # TypeScript compilation will catch type errors
```

Happy testing! 🚀
