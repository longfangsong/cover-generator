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

Return ONLY the JSON object, no additional text.
</system>

<user>
{resumeText}
</user>
`;

/**
 * Data structure for resume extraction prompt generation
 */
export interface ResumeExtractionPromptData {
  resumeText: string;
}

/**
 * Fill template with prompt data
 */
export function fillTemplate(template: string, data: ResumeExtractionPromptData): string {
  return template.replace(/{resumeText}/g, data.resumeText);
}

/**
 * Build complete resume extraction prompt
 */
export function buildResumeExtractionPrompt(resumeText: string): string {
  const data: ResumeExtractionPromptData = { resumeText };
  return fillTemplate(RESUME_EXTRACTION_PROMPT, data);
}
