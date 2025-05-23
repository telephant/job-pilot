/**
 * Prompt templates for the generator 
 */

type CoverLetterPrompt = {
  jd: string;
  resume: string;
  companyName: string;
}

export const coverLetterPrompt = ({jd, resume, companyName}: CoverLetterPrompt) => `
You are an experienced English job application assistant. Your task is to generate a complete and personalized English cover letter based on the job description and the user's resume.

Instructions:
- Extract the user's name, email, phone number, and address from the resume and use them to complete the header of the letter.
- DO NOT use placeholders like [Your Name] or [Phone Number]; instead, auto-fill those values from the resume.
- Use today's date in the format: May 22, 2025.
- Start the letter directly with the salutation: "Dear Hiring Manager,"
- Search the web (if possible) or use the company name and job context to write a brief, thoughtful line showing familiarity with the company or its industry.
- Keep the tone professional, positive, and natural — like it’s written by a real person.
- Absolutely avoid clichés, buzzwords, or generic filler.
- DO NOT exceed 300 words and DO NOT write less than 200 words.
- Final length must be strictly between 200–300 words
— please count and respect this limit.

Company Name:
${companyName}

Job Description:
${jd}

Resume:
${resume}

Use the following structure and format:

Header:
[Extracted Name]  
[Extracted Address]  
[Extracted Email]  
[Extracted Phone]  
May 22, 2025  

Dear Hiring Manager,

**Paragraph 1 – Introduction:**  
State the position you’re applying for and where you found it. Briefly introduce your background (1–2 sentences) and express genuine enthusiasm for the role.

**Paragraph 2 – Why You’re a Great Fit:**  
Highlight the most relevant experiences and skills that align with the job. Be specific. Use the resume and job description to make a strong match.

**Paragraph 3 – Why This Company:**  
Mention one or two thoughtful, well-informed points about the company or its culture, products, or mission. Show why you're excited about this role at this organization.

**Paragraph 4 – Closing:**  
Reaffirm your interest and what you offer. Politely express your hope for an interview. Thank the reader for their time.

Sincerely,  
[Extracted Name]

Reminder: The total word count **must** be between 200 and 300 words.

TONE LIKE THIS:
Dear Hiring Manager,  
Thank you for maintaining such a vibrant and engaging presence on your Linkedin page: celebrating not only a strong Q1 performance, outpacing peers, but also the people behind the results and the culture that fuels the success. I see values like diversity and inclusion, collaboration and openness, adaptability and dynamics, all of which resonate with me. Having spent the past five years in a fast-paced, ever-evolving start-up environment, I'm eager to carry that momentum and contribute to strengthening flacom's bottom line.
Starting as an accountant, I gained hands-on experience through running full-cycle books for 30 entities following International Financial Reporting Standards (IFRS). So, it became natural when I proceeded to the financial reporting manager position and handled the month-end closing and consolidation of two separate groups in parallel.
Working closely with the product and operation team, I assisted with developing the budget for the lottery launch, an unprecedented initiative in the region despite non-
`;

type SelfIntroPrompt = {
  jd: string;
  resume: string;
  companyName: string;
}

export const selfIntroPrompt = ({jd, resume, companyName}: SelfIntroPrompt) => `
You are an English job application assistant. Please write a brief, natural-sounding self-introduction for a job application.

The introduction should:
- Be written in English, from the first-person perspective
- Be under 150 words!!!!!!
- Sound confident, personable, and authentic
- Clearly show how my background and skills align with the job
- Mention my career goals if relevant
- Avoid clichés or robotic phrasing

Below is the job description and my resume.

Company Name:
${companyName}

Job Description:
${jd}

My Resume:
${resume}
`;
