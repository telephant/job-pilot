import { fetchLinkedInAlerts } from './email/fetchLinkedInAlerts';
import { startServer } from './server';
import { main as mainLogger, setupDebug } from './utils/debug';
import { JobListing } from './email/jobParser';
import { batchScrapeJDs, JobDescription } from './scraper/scrapeJD';

// Enable debug logs by default
setupDebug();

async function main() {
  try {
    // Start the server first to handle OAuth callback
    mainLogger.log('Starting server for OAuth callback...');
    startServer();
    
    // Then fetch LinkedIn alerts
    mainLogger.log('Starting to fetch LinkedIn job alerts...');
    const jobListings = await fetchLinkedInAlerts();
    
    if (jobListings.length === 0) {
      mainLogger.log('No job listings found');
      return;
    }
    
    // Ask if user wants to scrape job descriptions
    console.log('\nWould you like to scrape job descriptions? (y/n)');
    process.stdin.once('data', async (data) => {
      const input = data.toString().trim().toLowerCase();
      
      if (input === 'y' || input === 'yes') {
        // Get URLs from job listings
        const urls = jobListings.map(job => job.url).filter(url => url);
        
        if (urls.length === 0) {
          console.log('No valid URLs found to scrape');
          process.exit(0);
        }
        
        console.log(`\nScraping ${urls.length} job descriptions...`);
        
        try {
          // Scrape job descriptions
          const jobDescriptions = await batchScrapeJDs(jobListings);
          
          // Display the job descriptions
          console.log('\n===== Job Descriptions =====\n');
          jobDescriptions.forEach((jd, index) => {
            console.log(`\n[${index + 1}] ${jd.title} at ${jd.company}`);
            console.log(`    Location: ${jd.location}`);
            console.log(`    Job Type: ${jd.jobType}`);
            console.log(`    Date Posted: ${jd.datePosted}`);
            
            if (jd.qualifications.length > 0) {
              console.log('\n    Qualifications:');
              jd.qualifications.forEach(qual => console.log(`    • ${qual}`));
            }
            
            if (jd.responsibilities.length > 0) {
              console.log('\n    Responsibilities:');
              jd.responsibilities.forEach(resp => console.log(`    • ${resp}`));
            }
            
            console.log('\n    Description (excerpt):');
            console.log(`    ${jd.description.substring(0, 200)}...`);
            console.log('\n-------------------------------------------');
          });
          
          mainLogger.log('Job scraping complete - scraped %d descriptions', jobDescriptions.length);
        } catch (error) {
          mainLogger.error('Error during job scraping: %O', error);
        }
      } else {
        console.log('Skipping job description scraping');
      }
      
      process.exit(0);
    });
    
  } catch (error) {
    mainLogger.error('Error in main process: %O', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
