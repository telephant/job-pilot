import { google } from 'googleapis';
import { getAuthenticatedClient } from '../oauth/googleAuth';
import { email as emailLogger } from '../utils/debug';
import { parseLinkedInJobListings, JobListing } from './jobParser';

/**
 * Fetch LinkedIn job alert emails from Gmail and extract job listings
 * @returns List of job listings extracted from emails
 */
export const fetchLinkedInAlerts = async (): Promise<JobListing[]> => {
  emailLogger.log('Authenticating Gmail client...');
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  // Search for LinkedIn job alert emails
  emailLogger.log('Searching for LinkedIn job alert emails...');
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:(jobs-noreply@linkedin.com) subject:(jobs)',
    maxResults: 1,
  });

  // todo: test 1 email
  const messages = res.data.messages || [];
  if (messages.length === 0) {
    emailLogger.log('No LinkedIn job alert emails found.');
    return [];
  }

  emailLogger.log('Found %d LinkedIn job alert emails', messages.length);
  
  // Will hold all jobs from all emails
  const allJobs: JobListing[] = [];
  
  for (const msg of messages) {
    try {
      const msgRes = await gmail.users.messages.get({ 
        userId: 'me', 
        id: msg.id!,
        format: 'full' // Get the full message content
      });

      // Extract the subject for logging
      const subjectHeader = msgRes.data.payload?.headers?.find(h => h.name === 'Subject');
      emailLogger.log('Processing email: %s', subjectHeader?.value);
      
      // Find and decode the email body content
      const parts = msgRes.data.payload?.parts || [];
      let emailBody = '';
      
      // Try to find an HTML or plain text part
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          emailBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
      
      if (!emailBody) {
        emailLogger.log('No readable content found in email');
        continue;
      }
      
      // Parse job listings from the email body
      const jobsInEmail = parseLinkedInJobListings(emailBody, msg.id!);
      emailLogger.log('Extracted %d jobs from email', jobsInEmail.length);

      if (allJobs.length > 0) {
        emailLogger.log('Skipping email %s as we already have jobs', msg.id);
        break;
      }
      
      // Add to our collection
      allJobs.push(...jobsInEmail);
      
    } catch (error) {
      emailLogger.error('Error processing email %s: %O', msg.id, error);
    }
  }
  
  emailLogger.log('Total jobs extracted: %d', allJobs.length);
  return allJobs;
};
