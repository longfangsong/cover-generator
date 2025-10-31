/**
 * Resume Extraction Prompt
 * Template and utilities for LLM-based resume parsing
 */

export const RESUME_EXTRACTION_PROMPT = `<system>You are a resume parser. Extract structured information from the following resume text and return it as a JSON object.

EXTRACTION RULES:
1. Extract all available information
2. Use null for missing fields
3. For dates, use ISO 8601 format (YYYY-MM-DD)
4. For skills, extract individual skills as separate array items
5. Keep what the user wrote; do not infer or add information
6. Preserve all relevant details about roles and achievements
7. For homepage, github and linkedin, extract the URLs if they exists
</system>

<user>
{resumeText}
</user>
`;

/**
 * Build complete resume extraction prompt
 */
export function buildPrompt(resumeText: string): string {
  return RESUME_EXTRACTION_PROMPT.replace(/{resumeText}/g, resumeText);
}
