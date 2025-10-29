# Cover Letter Generator Browser Plugin Constitution

## Core Principles

### I. User Privacy & Data Security (NON-NEGOTIABLE)

User personal information and job descriptions are sensitive data. This plugin MUST:

- Minimize data storage; retain only what user explicitly saves locally
- Never transmit personal data or job descriptions to third parties without explicit user consent
- Provide clear disclosure of what data flows to the LLM service (e.g., "Your data will be sent to OpenAI")
- Support local-first operation where possible (e.g., client-side processing before LLM calls)
- Encrypt sensitive data at rest if stored persistently
- Include a "data usage" setting allowing users to review/export/delete their submission history

**Rationale**: Users trust the plugin with personal career information. Privacy breaches destroy trust and may violate regulatory requirements (GDPR, CCPA). Every data handling decision must prioritize user control and transparency.

### II. LLM-Powered Content Generation Excellence

The core value is generating contextually relevant cover letters. The plugin MUST:

- Accept structured user inputs: name, skills, experience, target role, company context
- Parse and extract key details from browsed job postings automatically where safe to do so
- Send well-formed, detailed prompts to the LLM (context matters for quality output)
- Allow users to refine outputs iteratively (regenerate, edit, refine prompts)
- Support multiple LLM backends (at minimum: OpenAI API, with abstraction for future extensibility)
- Cache LLM responses per job posting to avoid redundant API calls

**Rationale**: Quality cover letters require rich context. Integration must be seamless, fast, and user-controllable. LLM backend abstraction ensures future flexibility.

### III. Seamless Browser Integration & Non-Intrusive UX

The plugin exists in the browser to reduce friction in the job application workflow:

- Popup UI launches in <200ms; no modal overlays that block page navigation
- Detect common job posting platforms (LinkedIn, Indeed, etc.) and pre-populate job context automatically
- Allow inline editing of extracted job details in case auto-detection is imperfect
- Provide one-click copy-to-clipboard for generated cover letters
- Store plugin settings (LLM API key, user profile, preferences) securely in browser storage (encrypted if possible)
- Graceful degradation: plugin works offline for previously saved profiles; gracefully fails if LLM is unavailable

**Rationale**: Users are in a high-friction workflow (job searching). Every interaction must feel natural. Interruptions and slowness will cause abandonment.

### IV. Test-First Development (Mandatory)

Every feature MUST have tests written before implementation:

- Unit tests: Core LLM integration logic, data extraction, prompt formatting
- Integration tests: Plugin ↔ job posting site interactions, LLM API mocking
- UI tests (Cypress or Playwright): Popup opens/closes, form submission, copy-to-clipboard
- Red-Green-Refactor cycle strictly enforced
- Acceptance criteria from spec MUST be expressed as passing tests before "done"

**Rationale**: Plugins are fragile (browser updates, site layout changes, API changes). Tests catch regressions early. Plugin availability directly impacts user trust.

### V. Clear Data Flow & Observability

Users and developers MUST understand what happens to their data at each step:

- All API calls (LLM, analytics, etc.) MUST be logged in a structured format (console + optional remote logging with consent)
- Logs MUST NOT contain sensitive user data by default (use placeholders like `[USER_NAME]`, `[JOB_TITLE]`)
- Errors MUST be user-friendly ("Could not connect to LLM service. Retry?" not "CORS error")
- Plugin MUST report usage metrics (calls/day, success rate) to user dashboard for transparency
- Code comments MUST explain why data is retained/sent, not just how

**Rationale**: Transparency builds trust. When things go wrong, clear logs enable fast debugging. Users deserve to know their data's journey.

## Security & Compliance Requirements

- **LLM API Key Storage**: MUST be encrypted in browser storage. Never log, never transmit unencrypted.
- **Rate Limiting**: Client-side rate limiting to prevent accidental API abuse (max 10 requests/minute per user).
- **Browser Permissions**: Minimize requested permissions. Only request `activeTab` and `scripting` for job site detection; request `storage` for local settings.
- **External Dependencies**: Audit all npm packages quarterly. Lock versions in `pnpm-lock.yaml`.

## Development Workflow & Quality Gates

- **Branching**: Feature branches from `main` prefixed with `feature/`, `bugfix/`, or `security/`
- **Code Review**: All PRs require review. Reviewer MUST verify: test coverage >80%, no hardcoded secrets, constitution compliance.
- **TypeScript Strict Mode**: MUST be enforced. No `any` types without justification.
- **Build Requirement**: PR build MUST pass before merge. Zero broken builds in main.
- **Release Process**: Tag releases as `vX.Y.Z`. Update `package.json`, build extension, publish to Chrome Web Store / Firefox Add-ons.

## Governance

This constitution supersedes all other guidance. All PRs, features, and design decisions MUST be evaluated against these principles.

**Amendment Process**:

1. Proposed amendment MUST be documented with rationale in a GitHub issue.
2. Amendment requires lead developer approval and ratified in a decision doc.
3. Version MUST be bumped (semver) and `LAST_AMENDED_DATE` updated.
4. Dependent templates (spec, tasks, plan) MUST be reviewed and updated if affected.

**Compliance Review**: Every sprint, review one completed feature against all principles. Document findings in a pull request comment or checklist. Escalate violations.

**Version**: 1.0.0 | **Ratified**: 2025-10-27 | **Last Amended**: 2025-10-27
