import fs from 'fs';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import readline from 'readline';
import credentials from '../../credentials.json';
import { TOKEN_PATH } from '../config';
import { auth as authLogger, token as tokenLogger } from '../utils/debug';

// Scopes define what access we're requesting from the user's Gmail account
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const REDIRECT_URI = 'http://localhost:3000';

/**
 * Creates and returns an authenticated OAuth2 client for Gmail API access
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  // Create the OAuth client with our credentials
  const oAuth2Client = createOAuthClient();
  
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
function createOAuthClient(): OAuth2Client {
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
