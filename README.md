# Job Pilot 🚀

A handy tool that helps you stay on top of your job search by automatically processing LinkedIn job alerts from your email and extracting detailed job descriptions.

## What does it do?

Job Pilot connects to your Gmail account, finds LinkedIn job alert emails, extracts the job listings, and then scrapes the full job descriptions from LinkedIn. It saves everything in a structured format so you can easily review opportunities without constantly switching between emails and browser tabs.

## Why I built this

Looking for a job means dealing with dozens of email alerts and countless browser tabs. I wanted a tool that would:

- Gather all my job opportunities in one place
- Extract the important details from each listing
- Help me keep track of which positions match my skills
- Save time by automating the boring parts of job hunting

## Features

- 📧 **Email Integration**: Automatically fetches LinkedIn job alerts from Gmail
- 🔍 **Smart Parsing**: Extracts job titles, companies, locations, and links
- 🕸️ **Web Scraping**: Gets full job descriptions including responsibilities and qualifications
- 💾 **Automatic Saving**: Stores all job data as JSON files for easy reference
- 🔐 **Secure Authentication**: Uses OAuth for Gmail and handles LinkedIn login
- ✍️ **Content Generation**: Creates personalized cover letters and self-introductions based on your resume
- 📄 **PDF Support**: Works with both PDF and text resume formats

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- A Gmail account with LinkedIn job alerts
- LinkedIn credentials

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/job-pilot.git
   cd job-pilot
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Set up your credentials:
   - Create a `.env` file with your LinkedIn credentials:
     ```
     LINKEDIN_USERNAME=your_linkedin_email@example.com
     LINKEDIN_PASSWORD=your_linkedin_password
     ```
   - Follow the instructions during first run to authorize Gmail access

## Using Job Pilot

### Job Scraping

Run the tool with:

```
pnpm start
```

The first time you run it, you'll be guided through the OAuth process for Gmail. After that:

1. The tool will fetch your LinkedIn job alert emails
2. It will extract job listings and display them
3. You'll be asked if you want to scrape the detailed job descriptions
4. If you choose yes, it will visit each job page and extract the details
5. All job data will be saved to the `job-data` folder

### Content Generation

To generate cover letters and self-introductions for job applications:

1. Place your resume in the `resume` folder (supports both PDF and TXT formats)
2. Run the generation command:
   ```
   pnpm generate <job-data-file> [cover_letter|self_introduction|both] [options]
   ```

Available options:
- `--tone=professional|conversational|enthusiastic`: Sets the tone of the content
- `--length=short|medium|long`: Controls the length of the generated content
- `--format=text|html|markdown`: Specifies the output format
- `--include-story`: Adds a personal story or anecdote to the content
- `--emphasize=skill1,skill2,skill3`: Highlights specific skills or experiences

Example:
```
pnpm generate job-data/job-descriptions-2023-05-22.json cover_letter --length=medium --tone=enthusiastic
```

Generated content will be saved to the `generated-content` folder.

## Tips for Best Results

- Make sure you're subscribed to LinkedIn job alerts via email
- Consider creating filters in Gmail to organize your job alerts
- Check the `job-data` folder after running to review all the jobs in one place
- Use a detailed and well-formatted resume for better personalized content generation
- For best results with PDF resumes, ensure your PDF is text-based and not scanned images

## Troubleshooting

### Resume Issues

- **No resume found**: If you get a warning about no resume found, make sure you have a file in the `resume` folder with a `.pdf` or `.txt` extension.
- **Empty or invalid PDF**: For PDF files, ensure they are text-based and not just scanned images. The tool needs to be able to extract the text content.
- **Resume not personalized**: If your generated content doesn't seem to incorporate your resume details, check that your resume file is being properly loaded.

### API Key Issues

- **Invalid API Key**: Make sure you've set a valid OpenAI API key in your `.env` file using the format `OPENAI_API_KEY=your-key-here`.
- **Rate Limits**: If you encounter rate limit errors, try using the `--length=short` option to reduce token usage or add delays between generations.

### Generation Issues

- **Poor Quality Content**: The quality of generated content depends on:
  - The detail and clarity of the job description
  - The quality and relevance of your resume
  - The API model being used

If you encounter other issues, check the console output for error messages that might provide more information.

## Privacy Note

Your credentials are stored locally and are never sent to any server other than Gmail and LinkedIn. OAuth tokens for Gmail are stored in `token.json`, and LinkedIn cookies in `linkedin-cookies.json`.

## Contributing

Have ideas to make Job Pilot better? Feel free to:
- Open an issue with suggestions
- Submit a pull request with improvements
- Reach out with feedback

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Happy job hunting! 🎯 