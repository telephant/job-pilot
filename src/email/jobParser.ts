import { email as emailLogger } from '../utils/debug';

/**
 * Job listing data structure
 */
export interface JobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  jobId: string;
  emailMsgId: string;
}

/**
 * Extracts job listings from LinkedIn email body content
 */
export function parseLinkedInJobListings(emailBody: string, emailMsgId: string): JobListing[] {
  // Split by the separator line
  const sections = emailBody.split('---------------------------------------------------------');
  const jobs: JobListing[] = [];

  // Process each section that might contain a job
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 10) continue; // Skip empty sections
    
    // Skip sections that are clearly not job listings
    if (isNotJobListing(trimmed)) {
      emailLogger.log('Skipping non-job section: %s...', trimmed.substring(0, 30));
      continue;
    }
    
    try {
      const jobListing = parseJobSection(trimmed, emailMsgId);
      jobs.push(jobListing);
      // Prettier log format with all job details properly aligned
      emailLogger.log(
        '\n✅ Parsed Job:\n' +
        '   📌 Title:    %s\n' +
        '   🏢 Company:  %s\n' +
        '   📍 Location: %s\n' + 
        '   🔗 URL:      %s\n' +
        '   🆔 Job ID:   %s',
        jobListing.title,
        jobListing.company,
        jobListing.location,
        jobListing.url,
        jobListing.jobId || '(not found)'
      );
    } catch (error) {
      emailLogger.error('Failed to parse job section: %O', error);
    }
  }

  return jobs;
}

/**
 * Checks if a section is not a job listing but rather a related links section
 */
function isNotJobListing(section: string): boolean {
  const lowercaseSection = section.toLowerCase();
  
  // Patterns that indicate this is not a job listing
  const nonJobPatterns = [
    'jobs similar to',
    'see all jobs',
    'search for more',
    'search other jobs',
    'similar jobs',
    'jobs at ',
    'jobs in '
  ];
  
  // Check if the section contains any of the non-job patterns
  for (const pattern of nonJobPatterns) {
    if (lowercaseSection.includes(pattern)) {
      return true;
    }
  }
  
  // Count the number of URLs - job listings typically have only one
  const urlCount = (section.match(/https:\/\/www\.linkedin\.com/g) || []).length;
  if (urlCount > 2) {
    return true;
  }
  
  return false;
}

/**
 * Parse a single job section into structured data
 */
function parseJobSection(section: string, emailMsgId: string): JobListing {
  // Split the content into lines and filter out empty lines
  const lines = section.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Extract job details - assuming a consistent format
  if (lines.length < 3) {
    emailLogger.error('Invalid job section format: %s', section);
    throw new Error('Invalid job section format');
  }
  const title = lines[0]; // First line is the job title
  const company = lines[1]; // Second line is the company
  const location = lines[2]; // Third line is the location
  
  // Find the URL line
  const urlLine = lines.find(line => line.startsWith('View job:'));
  let url = '';
  let jobId = '';
  
  if (urlLine) {
    url = urlLine.replace('View job:', '').trim();
    // Extract job ID from URL
    const matches = url.match(/\/jobs\/view\/(\d+)/);
    jobId = matches && matches[1] ? matches[1] : '';
  }

  return {
    title,
    company,
    location,
    url,
    jobId,
    emailMsgId,
  };
} 