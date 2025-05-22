import fs from 'fs';
import path from 'path';
import { BrowserContext, chromium } from 'playwright';
import { JobListing } from '../email/jobParser';
import { scraper as scraperLogger } from '../utils/debug';

/**
 * Job description data structure
 */
export interface JobDescription {
  title: string;
  company: string;
  location: string;
  jobType: string;
  description: string;
  qualifications: string[];
  responsibilities: string[];
  datePosted: string;
  jobId: string;
  url: string;
}

let page: any = null;
let loggedIn = false;

// LinkedIn login credentials - should be set in environment variables
const LINKEDIN_USERNAME = process.env.LINKEDIN_USERNAME || 'telephant11@gmail.com';
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD || 'Mr.T546228';
const COOKIES_PATH = path.join(process.cwd(), 'linkedin-cookies.json');

/**
 * Handles LinkedIn login and returns a configured browser context
 */
async function setupBrowserWithAuth(): Promise<{ browser: any, context: BrowserContext }> {
  // Launch browser
  const browser = await chromium.launch({
    headless: true // Set to false for debugging
  });
  
  // Create a new context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
  });
  
  // Load cookies if they exist to maintain session
  try {
    if (fs.existsSync(COOKIES_PATH)) {
      const cookiesString = fs.readFileSync(COOKIES_PATH, 'utf8');
      const cookies = JSON.parse(cookiesString);
      await context.addCookies(cookies);
      scraperLogger.log('Loaded existing LinkedIn cookies');
    }
  } catch (error) {
    scraperLogger.error('Error loading cookies: %O', error);
  }
  
  return { browser, context };
}

/**
 * Check if user is logged in to LinkedIn
 */
async function isLoggedIn(page: any): Promise<boolean> {
  if (loggedIn) {
    return true;
  }
  // Check for elements that indicate logged-in state
  const loggedInIndicators = [
    '.global-nav__me', // Profile icon in nav
    '.feed-identity-module', // Profile section in feed
    '[data-control-name="identity_welcome_message"]' // Welcome message
  ];
  
  for (const selector of loggedInIndicators) {
    if (await page.$(selector).catch(() => null)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Handle LinkedIn login
 */
async function loginToLinkedIn(context: BrowserContext): Promise<boolean> {
  if (!LINKEDIN_USERNAME || !LINKEDIN_PASSWORD) {
    scraperLogger.error('LinkedIn credentials not provided. Set LINKEDIN_USERNAME and LINKEDIN_PASSWORD environment variables.');
    return false;
  }
  
  scraperLogger.log('Logging in to LinkedIn...');
  
  try {
    // Navigate to login page
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for login form
    await page.waitForSelector('#username', { timeout: 10000 });
    
    // Fill login form
    await page.fill('#username', LINKEDIN_USERNAME);
    await page.fill('#password', LINKEDIN_PASSWORD);
    scraperLogger.log('Filled login form');
    
    // Click login button
    await page.click('[type="submit"]');
    scraperLogger.log('Clicked login button');
    
    // sleep for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    loggedIn = true;

    scraperLogger.log('LinkedIn login successful');
      
    // Save cookies for future sessions
    const cookies = await context.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies));
    scraperLogger.log('Saved LinkedIn cookies');
    
    return true;
  } catch (error) {
    scraperLogger.error('Error during LinkedIn login: %O', error);
    return false;
  }
}

/**
 * Check if we need to log in based on current page content
 */
async function handleLoginIfNeeded(context: BrowserContext): Promise<boolean> {
  // First check if user is already logged in
  const loggedIn = await isLoggedIn(page);
  
  if (loggedIn) {
    scraperLogger.log('User is already logged in to LinkedIn');
    return true;
  }
  
  // Not logged in, so actively navigate to login page
  scraperLogger.log('User not logged in. Navigating to LinkedIn login page...');
  const res = await loginToLinkedIn(context);
  return res;
}

/**
 * Scrape a job description from a LinkedIn job URL
 * @param url LinkedIn job URL
 * @returns Structured job description data
 */
export async function scrapeJD(url: string): Promise<JobDescription> {
  scraperLogger.log('Starting to scrape job description from: %s', url);
  
  // Set up browser with authentication
  const { browser, context } = await setupBrowserWithAuth();
  
  try {
    // Create a new page in the authenticated context
    page = await context.newPage();
    
    // First, verify login status by visiting LinkedIn homepage
    scraperLogger.log('Verifying LinkedIn authentication status...');
    await page.goto('https://www.linkedin.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Debug: Log the current URL to see if we're redirected
    scraperLogger.log('Current URL after visiting LinkedIn: %s', page.url());
    
    // Check if we need to log in
    const isAuthenticated = await handleLoginIfNeeded(context);
    if (!isAuthenticated) {
      scraperLogger.error('Failed to authenticate with LinkedIn');
      throw new Error('Failed to authenticate with LinkedIn');
    }
    
    // Now navigate to the job URL
    scraperLogger.log('Successfully authenticated. Navigating to job page: %s', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Debug: Save screenshot for troubleshooting
    await page.screenshot({ path: 'linkedin-job-page.png' });
    
    // Wait for the job content to load
    await page.waitForSelector('#job-details', { timeout: 10000 })
      .catch(async (err: Error) => {
        scraperLogger.log('Could not find #job-details, capturing page content for debugging');
        // Save the HTML for debugging
        const html = await page.content();
        fs.writeFileSync('linkedin-job-page.html', html);
        throw err;
      });
    
    scraperLogger.log('Job page loaded, extracting data...');
    
    // Extract job details
    const jobData = await extractJobData(url);
    
    scraperLogger.log('Successfully extracted job data');
    return jobData;
  } catch (error) {
    scraperLogger.error('Error scraping job description: %O', error);
    
    // If page exists, try to capture content for debugging
    if (page) {
      try {
        await page.screenshot({ path: 'linkedin-error.png' });
        const html = await page.content();
        fs.writeFileSync('linkedin-error.html', html);
        scraperLogger.log('Captured error state for debugging');
      } catch (captureError) {
        scraperLogger.error('Failed to capture error state: %O', captureError);
      }
    }
    
    throw error;
  } finally {
    // Always close the browser
    await browser.close();
  }
}

/**
 * Extract structured job data from the page
 */
async function extractJobData(originalUrl: string): Promise<JobDescription> {
  // Extract job ID from URL
  const urlObj = new URL(originalUrl);
  const pathParts = urlObj.pathname.split('/');
  const jobId = pathParts.find(part => /^\d+$/.test(part)) || '';
  
  // Use default values for job metadata since header extraction is failing
  const title = '';
  const company = '';
  const location = '';
  const jobType = '';
  const datePosted = '';
  
  // Extract the full job description using the ID as suggested
  let fullDescription = '';
  try {
    // Get the full text content from #job-details directly
    // fullDescription = await page.$eval('#job-details', (el: any) => el.innerText.trim());
    const div = await page.$('#job-details');
    await div.scrollIntoViewIfNeeded();
    const text = await div.innerText(); // or .textContent()
    fullDescription = text || '';
    
    scraperLogger.log('Successfully extracted job description of length: %d characters', fullDescription.length, fullDescription);
  } catch (error) {
    scraperLogger.error('Failed to extract job description: %O', error);
  }
  
  // Extract responsibilities and qualifications sections from the full description
  const { responsibilities, qualifications } = extractSectionsFromText(fullDescription);
  
  return {
    title,
    company,
    location,
    jobType,
    description: fullDescription,
    qualifications,
    responsibilities,
    datePosted,
    jobId,
    url: originalUrl
  };
}

/**
 * Helper function to get text content from a selector
 * Returns empty string if selector doesn't exist
 */
async function getTextContent(selector: string): Promise<string> {
  try {
    return await page.$eval(selector, (el: any) => el.textContent.trim());
  } catch (error) {
    return '';
  }
}

/**
 * Extract responsibility and qualification sections from the full job description text
 */
function extractSectionsFromText(fullText: string): { responsibilities: string[], qualifications: string[] } {
  const responsibilities: string[] = [];
  const qualifications: string[] = [];
  
  // Split the text into lines
  const lines = fullText.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentSection = '';
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a section header
    if (line.toLowerCase().includes('responsibilities:')) {
      currentSection = 'responsibilities';
      continue;
    } else if (line.toLowerCase().includes('qualifications:')) {
      currentSection = 'qualifications';
      continue;
    }
    
    // If we're in a relevant section and this looks like a bullet point
    if (currentSection && (line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line))) {
      if (currentSection === 'responsibilities') {
        responsibilities.push(line);
      } else if (currentSection === 'qualifications') {
        qualifications.push(line);
      }
    }
  }
  
  // If we couldn't find explicit bullet points, try to identify list items by context
  if (responsibilities.length === 0 && qualifications.length === 0) {
    scraperLogger.log('No bullet points found, trying alternative extraction method');
    return extractSectionsByContext(fullText);
  }
  
  return { responsibilities, qualifications };
}

/**
 * Alternative extraction method that identifies list items by context
 */
function extractSectionsByContext(fullText: string): { responsibilities: string[], qualifications: string[] } {
  const responsibilities: string[] = [];
  const qualifications: string[] = [];
  
  // First, try to find the sections in the text
  const respMatch = fullText.match(/responsibilities:?(.*?)(?:qualifications|requirements|about you|skills|experience|what you'll need)/is);
  const qualMatch = fullText.match(/qualifications:?(.*?)(?:about us|about the company|benefits|what we offer|$)/is);
  
  if (respMatch && respMatch[1]) {
    // Split by likely list item markers and clean up
    const items = respMatch[1].split(/(?:\r?\n)+/)
      .map(line => line.trim())
      .filter(line => line.length > 10 && !line.endsWith(':'));
    
    responsibilities.push(...items);
  }
  
  if (qualMatch && qualMatch[1]) {
    // Split by likely list item markers and clean up
    const items = qualMatch[1].split(/(?:\r?\n)+/)
      .map(line => line.trim())
      .filter(line => line.length > 10 && !line.endsWith(':'));
    
    qualifications.push(...items);
  }
  
  return { responsibilities, qualifications };
}

/**
 * Batch scrape multiple job descriptions
 * @param input Array of LinkedIn job URLs or JobListing objects
 * @param emailMsgId Optional email message ID to include in the filename
 * @returns Array of job descriptions
 */
export async function batchScrapeJDs(input: JobListing[], emailMsgId?: string): Promise<JobDescription[]> {
  // Process as JobListing[] array
  const jobListings = input as JobListing[];
  scraperLogger.log('Starting batch scrape of %d job listings', jobListings.length);
  
  const results: JobDescription[] = [];
  
  // Process job listings sequentially to avoid LinkedIn rate limiting
  for (const jobListing of jobListings) {
    try {
      scraperLogger.log('Scraping job: %s at %s', jobListing.title, jobListing.company);
      
      // Get the detailed job description
      const jobData = await scrapeJD(jobListing.url);
      
      // Enhance the job data with information from the email listing
      // Prefer the email data for basic fields as it's more reliable than our scraper
      const enhancedJobData: JobDescription = {
        ...jobData,
        // Use email data for these fields if available
        title: jobListing.title || jobData.title,
        company: jobListing.company || jobData.company,
        location: jobListing.location || jobData.location,
        // Always use the email's job ID if available
        jobId: jobListing.jobId || jobData.jobId,
      };
      
      results.push(enhancedJobData);
    } catch (error) {
      scraperLogger.error('Error scraping job %s at %s: %O', 
        jobListing.title, jobListing.company, error);
      // Continue with other jobs even if one fails
    }
    
    // Add a small delay between requests to be nice to LinkedIn
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save job descriptions to a file
  if (results.length > 0) {
    await saveJobDescriptionsToFile(results, emailMsgId);
  }
  
  scraperLogger.log('Completed batch scrape, got %d/%d job descriptions', 
    results.length, jobListings.length);
  
  return results;
}

/**
 * Save job descriptions to a JSON file
 * @param jobDescriptions Array of job descriptions to save
 * @param emailMsgId Optional email message ID to include in the filename
 */
async function saveJobDescriptionsToFile(jobDescriptions: JobDescription[], emailMsgId?: string): Promise<void> {
  try {
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // Extract date portion for filename (YYYY-MM-DD)
    const dateStr = timestamp.split('T')[0];
    const outputDir = path.join(process.cwd(), 'job-data');
    
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate a filename based on date and email message ID
    const msgIdPart = emailMsgId ? `-${emailMsgId}` : '';
    const filename = path.join(outputDir, `job-descriptions-${dateStr}${msgIdPart}.json`);
    
    // Format the data for better readability
    const formattedData = JSON.stringify(jobDescriptions, null, 2);
    
    // Write to file
    fs.writeFileSync(filename, formattedData);
    scraperLogger.log('Saved %d job descriptions to %s', jobDescriptions.length, filename);
  } catch (error) {
    scraperLogger.error('Error saving job descriptions to file: %O', error);
  }
}
