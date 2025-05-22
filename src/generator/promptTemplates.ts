/**
 * Prompt templates for the generator 
 */

export const coverLetterPrompt = (jd: string, resume: string) => `
You are an English job application assistant, helping users generate a customized cover letter.
Please generate an English cover letter based on the following content, highlighting how my skills match the job requirements.

Job Description:
${jd}

My Resume:
${resume}

Requirements:
- Write in English
- Keep it between 300-400 words
- Use a professional yet enthusiastic tone
`;

export const selfIntroPrompt = (jd: string, resume: string) => `
Please generate an English self introduction for the job application.

Job Description:
${jd}

My Resume:
${resume}

Requirements:
- Write in English
- First person
- Keep it under 150 words
- Highlight job match and career goals
`;
