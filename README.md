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

## Tips for Best Results

- Make sure you're subscribed to LinkedIn job alerts via email
- Consider creating filters in Gmail to organize your job alerts
- Check the `job-data` folder after running to review all the jobs in one place

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