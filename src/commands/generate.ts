import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { 
  ContentGenerator, 
  GenerationOptions, 
  OutputFormat 
} from '../generator';
import { JobDescription } from '../scraper/scrapeJD';
import { main as mainLogger } from '../utils/debug';
import { displayCompletionMessage, displayGeneratedContent } from '../utils/display';

/**
 * Find available resume file in the resume directory
 * @returns Path to the resume file if found, null otherwise
 */
function findResumeFile(): string | null {
  const resumeDir = path.join(process.cwd(), 'resume');
  if (!fs.existsSync(resumeDir)) {
    console.log('🚀 Resume directory not found. Creating it...');
    fs.mkdirSync(resumeDir, { recursive: true });
    return null;
  }

  // Look for PDF files first, then text files
  const files = fs.readdirSync(resumeDir);
  
  // Check for PDF resumes
  const pdfResume = files.find(file => file.toLowerCase().endsWith('.pdf'));
  if (pdfResume) {
    return path.join(resumeDir, pdfResume);
  }
  
  // Check for text resumes
  const textResume = files.find(file => file.toLowerCase().endsWith('.txt'));
  if (textResume) {
    return path.join(resumeDir, textResume);
  }
  
  return null;
}

/**
 * Command to generate cover letters and self-introductions from job data files
 */
export async function generateContent(
  jobDataPath: string, 
  outputType: 'cover_letter' | 'self_introduction' | 'both' = 'both',
  options: GenerationOptions = {}
): Promise<void> {
  try {
    // Check if the job data file exists
    if (!fs.existsSync(jobDataPath)) {
      mainLogger.error('Job data file not found: %s', jobDataPath);
      throw new Error(`Job data file not found: ${jobDataPath}`);
    }
    
    // Read the job data file
    const jobData = JSON.parse(fs.readFileSync(jobDataPath, 'utf-8'));
    
    // Check if the job data is an array or a single job
    const jobDescriptions: JobDescription[] = Array.isArray(jobData) ? jobData : [jobData];
    
    mainLogger.log('Generating content for %d job descriptions', jobDescriptions.length);
    
    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY || 'sk-';
    if (apiKey === 'sk-') {
      console.log('⚠️ Warning: No OpenAI API key found. Set the OPENAI_API_KEY environment variable.');
      console.log('You can create a .env file with OPENAI_API_KEY=your-api-key');
    } else {
      console.log('🚀 Using OpenAI API key:', apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3));
    }
    
    // Find resume file (PDF or text)
    const resumePath = findResumeFile();
    console.log('🚀 ===== resumePath:', resumePath);
    if (resumePath) {
      mainLogger.log('Found resume file: %s', resumePath);
    } else {
      console.log('⚠️ No resume file found in the resume directory.');
      console.log('Please add a resume file (PDF or TXT) to the resume folder.');
      console.log('Example formats: resume.pdf, resume.txt, your_name_resume.pdf');
      
      // Ask if they want to continue without a resume
      console.log('\nDo you want to continue without a resume? (y/n)');
      const answer = await new Promise<string>(resolve => {
        process.stdin.once('data', data => {
          resolve(data.toString().trim().toLowerCase());
        });
      });
      
      if (answer !== 'y' && answer !== 'yes') {
        console.log('Operation canceled. Please add a resume file and try again.');
        process.exit(0);
      }
      
      console.log('Continuing without a resume. The generated content will be less personalized.');
    }
    
    // Initialize the content generator
    const generator = new ContentGenerator(
      {
        apiKey,
        baseUrl: 'https://api.chatanywhere.tech/v1',
        model: 'gpt-3.5-turbo',
      },
      resumePath || undefined
    );
    
    // Process each job description
    for (const jobDescription of jobDescriptions) {
      mainLogger.log('Processing job: %s at %s', jobDescription.title, jobDescription.company);
      
      if (outputType === 'cover_letter' || outputType === 'both') {
        try {
          const coverLetter = await generator.generateCoverLetter(jobDescription, options);
          
          displayGeneratedContent(
            coverLetter,
            'cover_letter',
            jobDescription.title,
            jobDescription.company
          );
        } catch (error: any) {
          mainLogger.error('Error generating cover letter: %O', error);
          console.error('Failed to generate cover letter:', error.message || error);
        }
      }
      
      if (outputType === 'self_introduction' || outputType === 'both') {
        try {
          const selfIntro = await generator.generateSelfIntroduction(jobDescription, options);
          
          displayGeneratedContent(
            selfIntro,
            'self_introduction',
            jobDescription.title,
            jobDescription.company
          );
        } catch (error: any) {
          mainLogger.error('Error generating self introduction: %O', error);
          console.error('Failed to generate self-introduction:', error.message || error);
        }
      }
      
      // Add a delay between requests to avoid rate limits
      if (jobDescriptions.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    displayCompletionMessage();
    
  } catch (error: any) {
    mainLogger.error('Error in generateContent command: %O', error);
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

/**
 * Entry point for CLI usage
 */
export async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.log('Usage: pnpm generate <job_data_file_path> [cover_letter|self_introduction|both] [options]');
      process.exit(1);
    }
    
    const jobDataPath = args[0];
    const outputType = (args[1] || 'both') as 'cover_letter' | 'self_introduction' | 'both';
    
    // Parse options
    const options: GenerationOptions = {
      tone: 'professional',
      length: 'medium',
      format: OutputFormat.TEXT,
      includePersonalStory: false,
    };
    
    // Extract options from args
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--tone=')) {
        const tone = arg.split('=')[1];
        if (['professional', 'conversational', 'enthusiastic'].includes(tone)) {
          options.tone = tone as any;
        }
      } else if (arg.startsWith('--length=')) {
        const length = arg.split('=')[1];
        if (['short', 'medium', 'long'].includes(length)) {
          options.length = length as any;
        }
      } else if (arg.startsWith('--format=')) {
        const format = arg.split('=')[1];
        if (['text', 'html', 'markdown'].includes(format)) {
          options.format = format as any;
        }
      } else if (arg === '--include-story') {
        options.includePersonalStory = true;
      } else if (arg.startsWith('--emphasize=')) {
        const emphasize = arg.split('=')[1];
        options.emphasize = emphasize.split(',');
      }
    }
    
    await generateContent(jobDataPath, outputType, options);
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
} 