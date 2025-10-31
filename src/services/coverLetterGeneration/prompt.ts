/**
 * PromptBuilder
 * Constructs LLM prompts from user profile and job details
 */

import { UserProfile } from '../../models/userProfile';
import { JobDetails } from '../../models/jobDetails';

export const COVER_LETTER_PROMPT = `<system>
You are a professional human cover letter writer specialized in tailoring content to specific job roles.
You will receive user profile information and job details.
Write a professional cover letter divided into four narrative sections.
Each section must demonstrate clear relevance to the job description and the user's background.
The tone must remain natural, confident, and engaging. 
Use words and phrases normal human beings would use, avoid generic claims, overuse of clichés, or overly formal language.

Guidelines for all sections:
- Refer only to the provided user information. Do not fabricate experience, achievements, or company facts.
- Avoid repeating the same detail across multiple sections.
- Maintain coherent narrative flow without section headings or lists.
- Integrate examples and outcomes when referencing experience.
- If any information is missing, craft the message without calling attention to the absence.

Addressee Selection:
- Determine the appropriate addressee for the cover letter based on the job posting
- If a specific hiring manager or contact person is mentioned, use their name (e.g., "John Smith")
- If a hiring team or department is mentioned, use that (e.g., "Engineering Team", "Hiring Committee")
- If no specific contact is mentioned but it's a specific company, use the company name (e.g., "Google Team")
- If none of the above apply, use "Hiring Manager" as a fallback
- Keep the addressee concise and professional (1-5 words)

Section requirements:
1. Opening (2-3 sentences)
   - Greeting and concise introduction, you don't need to include "Dear [Addressee],", that would be given in the template
   - Express interest in the position and mention how you learned about the opportunity
   - User requirement: "{openingInstruction}"

2. About Me (3-4 sentences)
   - Introduce relevant background, education, and core qualifications
   - Convey genuine motivation for the field
   - Personalize insights to show authenticity rather than resume repetition
   - User requirement: "{aboutMeInstruction}"

3. Why Me (4-5 sentences)
   - Directly align skills and achievements with the job requirements
   - Include specific examples that demonstrate capability and value
   - Highlight measurable or practical outcomes where possible
   - User requirement: "{whyMeInstruction}"

4. Why Company (3-4 sentences)
   - Explain specific interest in the company based on its mission, products, culture, or recent accomplishments
   - Clearly articulate enthusiasm for contributing to its success
   - User requirement: "{whyCompanyInstruction}"

Output Format:
Return a structured response with exactly five fields: addressee, opening, aboutMe, whyMe, whyCompany.
</system>

<user-info>
Name: {userName}
Email: {userEmail}
{userPhoneSection}
Skills: {userSkills}

Education:
{userEducation}

Work Experience:
{userExperience}

Personal Projects:
{userProjects}
</user-info>

<job-info>
Company: {jobCompany}
Position: {jobTitle}
Job Description: {jobDescription}
</job-info>
`;


/**
 * Data structure for cover letter prompt generation
 */
export interface CoverLetterPromptData {
  userName: string;
  userEmail: string;
  userPhone?: string;
  userEducation: string;
  userExperience: string;
  userProjects: string;
  userSkills: string;
  jobCompany: string;
  jobTitle: string;
  jobDescription: string;
  openingInstruction?: string;
  aboutMeInstruction?: string;
  whyMeInstruction?: string;
  whyCompanyInstruction?: string;
}

/**
 * Optional custom instructions for each cover letter section
 */
export interface SectionInstructions {
  opening?: string;
  aboutMe?: string;
  whyMe?: string;
  whyCompany?: string;
}

/**
 * Build prompt data from user profile and job details
 */
export function buildPromptData(
  profile: UserProfile,
  job: JobDetails,
  instructions?: SectionInstructions
): CoverLetterPromptData {
  return {
    userName: profile.name,
    userEmail: profile.email,
    userPhone: profile.phone,
    userEducation: formatEducation(profile),
    userExperience: formatExperience(profile),
    userProjects: formatProjects(profile),
    userSkills: profile.skills.join(', '),
    jobCompany: job.company,
    jobTitle: job.title,
    jobDescription: job.description,
    openingInstruction: instructions?.opening || '',
    aboutMeInstruction: instructions?.aboutMe || '',
    whyMeInstruction: instructions?.whyMe || '',
    whyCompanyInstruction: instructions?.whyCompany || '',
  };
}

/**
 * Fill template with prompt data
 */
export function fillTemplate(template: string, data: CoverLetterPromptData): string {
  let result = template;

  // Replace all template variables
  result = result.replace(/{userName}/g, data.userName);
  result = result.replace(/{userEmail}/g, data.userEmail);
  result = result.replace(/{userPhoneSection}/g, data.userPhone ? `Phone: ${data.userPhone}` : '');
  result = result.replace(/{userEducation}/g, data.userEducation);
  result = result.replace(/{userExperience}/g, data.userExperience);
  result = result.replace(/{userProjects}/g, data.userProjects);
  result = result.replace(/{userSkills}/g, data.userSkills);
  result = result.replace(/{jobCompany}/g, data.jobCompany);
  result = result.replace(/{jobTitle}/g, data.jobTitle);
  result = result.replace(/{jobDescription}/g, data.jobDescription);
  result = result.replace(/{openingInstruction}/g, data.openingInstruction || '');
  result = result.replace(/{aboutMeInstruction}/g, data.aboutMeInstruction || '');
  result = result.replace(/{whyMeInstruction}/g, data.whyMeInstruction || '');
  result = result.replace(/{whyCompanyInstruction}/g, data.whyCompanyInstruction || '');

  return result;
}

/**
 * Build complete prompt from profile and job details
 */
export function buildPrompt(
  profile: UserProfile,
  job: JobDetails,
  instructions?: SectionInstructions
): string {
  const data = buildPromptData(profile, job, instructions);
  return fillTemplate(COVER_LETTER_PROMPT, data);
}

/**
 * Format education entries for prompt
 */
function formatEducation(profile: UserProfile): string {
  if (!profile.education || profile.education.length === 0) {
    return 'N/A';
  }

  return profile.education.map(edu => {
    const parts: string[] = [];
    parts.push(`- ${edu.degree}`);
    if (edu.field) parts.push(`in ${edu.field}`);
    parts.push(`from ${edu.institution}`);
    if (edu.endDate) {
      const year = new Date(edu.endDate).getFullYear();
      parts.push(`(${year})`);
    } else if (edu.startDate) {
      const year = new Date(edu.startDate).getFullYear();
      parts.push(`(${year} - Present)`);
    }
    return parts.join(' ');
  }).join('\n');
}

/**
 * Format work experience entries for prompt
 */
function formatExperience(profile: UserProfile): string {
  if (!profile.experience || profile.experience.length === 0) {
    return 'N/A';
  }

  return profile.experience.map(exp => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.endDate ? new Date(exp.endDate) : null;
    const dateRange = endDate
      ? `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      : `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - Present`;

    const skillsText = exp.skills && exp.skills.length > 0
      ? `\n  Skills: ${exp.skills.join(', ')}`
      : '';

    const companyText = exp.company ? ` at ${exp.company}` : '';
    return `- ${exp.role}${companyText} (${dateRange})
  ${exp.description}${skillsText}`;
  }).join('\n\n');
}

/**
 * Format project entries for prompt
 */
function formatProjects(profile: UserProfile): string {
  if (!profile.projects || profile.projects.length === 0) {
    return 'N/A';
  }

  return profile.projects.map(proj => {
    const startDate = new Date(proj.startDate);
    const endDate = proj.endDate ? new Date(proj.endDate) : null;
    const dateRange = endDate
      ? `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      : `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - Present`;

    const skillsText = proj.skills && proj.skills.length > 0
      ? `\n  Skills: ${proj.skills.join(', ')}`
      : '';

    const orgText = proj.organization ? ` (${proj.organization})` : '';
    return `- ${proj.name}${orgText} (${dateRange})
  ${proj.description}${skillsText}$`;
  }).join('\n\n');
}
