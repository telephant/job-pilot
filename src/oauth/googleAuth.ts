import fs from 'fs';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import readline from 'readline';
import { TOKEN_PATH, CREDENTIALS_PATH } from '../config';
import { auth as authLogger, token as tokenLogger } from '../utils/debug';

// Scopes define what access we're requesting from the user's Gmail account
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const REDIRECT_URI = 'http://localhost:3000';

/**
 * Interface for Google OAuth credentials
 */
interface GoogleCredentials {
  installed: {
    client_id: string;
    client_secret: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    redirect_uris: string[];
  };
}

/**
 * Creates and returns an authenticated OAuth2 client for Gmail API access
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  // Check if credentials file exists
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`
❌ Missing Google OAuth credentials!

To fix this issue:

1. Go to the Google Cloud Console: https://console.cloud.google.com/
2. Create a new project (or select an existing one)
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Desktop application" as the application type
   - Name it something like "Job Pilot Gmail Access"
   - Download the credentials JSON file
5. Save the downloaded file as "credentials.json" in the root directory of this project

The credentials.json file should look like this:
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.googleusercontent.com",
    "project_id": "your-project-id", 
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:3000"]
  }
}

After adding the credentials.json file, run the application again.
`);
  }

  // Load credentials
  let credentials: GoogleCredentials;
  try {
    const credentialsContent = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    credentials = JSON.parse(credentialsContent);
  } catch (error) {
    throw new Error(`Failed to load credentials from ${CREDENTIALS_PATH}: ${error}`);
  }

  // Create the OAuth client with our credentials
  const oAuth2Client = createOAuthClient(credentials);
  
  // Try to use an existing token first (if available)
  if (await tryLoadExistingToken(oAuth2Client)) {
    return oAuth2Client;
  }
  
  // Otherwise, get a new token through the OAuth flow
  return getNewToken(oAuth2Client);
}

/**
 * Creates an OAuth2 client using credentials from the credentials file
 */
function createOAuthClient(credentials: GoogleCredentials): OAuth2Client {
  authLogger.log('Creating OAuth client');
  const { client_secret, client_id } = credentials.installed;
  return new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
}

/**
 * Attempts to load an existing token from the filesystem
 * @returns true if token was loaded successfully, false otherwise
 */
async function tryLoadExistingToken(oAuth2Client: OAuth2Client): Promise<boolean> {
  tokenLogger.log('Checking for existing token at: %s', TOKEN_PATH);
  
  if (!fs.existsSync(TOKEN_PATH)) {
    return false;
  }
  
  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
    
    // Check if the token is expired
    if (token.expiry_date && token.expiry_date <= Date.now()) {
      tokenLogger.log('Token is expired, attempting to refresh...');
      
      // Try to refresh the token
      try {
        const { credentials } = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(credentials);
        
        // Save the refreshed token
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
        tokenLogger.log('Token refreshed and saved successfully');
        return true;
      } catch (refreshError) {
        tokenLogger.error('Failed to refresh token: %O', refreshError);
        // Delete the invalid token file
        fs.unlinkSync(TOKEN_PATH);
        return false;
      }
    }
    
    tokenLogger.log('Successfully loaded existing token');
    return true;
  } catch (error) {
    tokenLogger.error('Failed to load token: %O', error);
    return false;
  }
}

/**
 * Gets a new token via OAuth2 authorization flow
 */
async function getNewToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  authLogger.log('Starting new token authorization flow');
  
  // Generate the authorization URL with appropriate scopes and settings
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',     // We want a refresh token for offline access
    scope: SCOPES,
    prompt: 'consent'           // Force the consent screen to appear
  });
  
  // Display the URL to the user
  console.log('\n⭐ Authorize this app by visiting this URL in your browser:\n', authUrl, '\n');
  
  // Get the authorization code from the user
  const code = await promptForAuthCode();
  
  // Exchange the code for tokens
  return exchangeCodeForTokens(oAuth2Client, code);
}

/**
 * Prompts the user to enter the authorization code
 */
async function promptForAuthCode(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const code = await new Promise<string>(resolve => {
    rl.question('Enter the code from that page here: ', resolve);
  });
  
  rl.close();
  return code;
}

/**
 * Exchanges an authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(oAuth2Client: OAuth2Client, code: string): Promise<OAuth2Client> {
  tokenLogger.log('Exchanging authorization code for tokens');
  
  try {
    const tokenResponse = await oAuth2Client.getToken(code);
    
    if (!tokenResponse.tokens) {
      throw new Error('No tokens received from Google OAuth');
    }
    
    // Set the credentials on the OAuth2 client
    oAuth2Client.setCredentials(tokenResponse.tokens);
    
    // Save the tokens to disk for future use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenResponse.tokens));
    tokenLogger.log('Token stored to %s', TOKEN_PATH);
    
    return oAuth2Client;
  } catch (error) {
    tokenLogger.error('Error getting token: %O', error);
    throw error;
  }
}
