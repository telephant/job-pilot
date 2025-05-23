# Google OAuth Setup Guide

Follow these steps to set up Google OAuth credentials for Job Pilot:

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Give your project a name (e.g., "Job Pilot")
5. Click "Create"

## Step 2: Enable the Gmail API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on the Gmail API result
4. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, etc.)
   - Add your email to test users
   - Save and continue through the scopes and summary
4. For Application type, choose "Desktop application"
5. Give it a name like "Job Pilot Gmail Access"
6. Click "Create"

## Step 4: Download and Save Credentials

1. After creating the OAuth client, click the download button (⬇️) to download the JSON file
2. Rename the downloaded file to `credentials.json`
3. Move the file to the root directory of your Job Pilot project (same level as package.json)

## Step 5: Run the Application

1. Now you can run the application with:
   ```bash
   pnpm dev
   ```
2. The first time you run it, you'll be prompted to authorize the application in your browser
3. Copy the authorization code and paste it into the terminal when prompted

Your `credentials.json` file should look something like this:

```json
{
  "installed": {
    "client_id": "1234567890-abcdef.apps.googleusercontent.com",
    "project_id": "job-pilot-123456",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-abcdef123456",
    "redirect_uris": ["http://localhost:3000"]
  }
}
```

## Troubleshooting

- Make sure the `credentials.json` file is in the root directory of the project
- Ensure the Gmail API is enabled in your Google Cloud project
- If you get permission errors, make sure your email is added as a test user in the OAuth consent screen
- For production use, you'll need to publish your OAuth app, but for personal use, test mode is sufficient 