import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';
import { JobDescription } from '../scraper/scrapeJD';
import { generator as generatorLogger } from '../utils/debug';
import { coverLetterPrompt, selfIntroPrompt } from './promptTemplates';
import { parseResumeFile } from '../utils/parseResume';

/**
 * Output formats for generated content
 */
export enum OutputFormat {
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
}

/**
 * Content generation options
 */
export interface GenerationOptions {
  tone?: 'professional' | 'conversational' | 'enthusiastic';
  length?: 'short' | 'medium' | 'long';
  format?: OutputFormat;
  emphasize?: string[];
  includePersonalStory?: boolean;
}

/**
 * Configuration for the OpenAI client
 */
export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Default configuration for the generator
 */
const DEFAULT_CONFIG: OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || 'sk-',
  baseUrl: 'https://api.chatanywhere.tech/v1',
  model: 'deepseek-r1',
  // model: 'gpt-3.5-turbo',
};

/**
 * Formats a job description into text format for the prompt
 */
export function formatJobDescription(jobDescription: JobDescription, includeQualifications = true): string {
  let formattedText = '';
  
  // Add job basics
  formattedText += `Job Title: ${jobDescription.title}\n`;
  formattedText += `Company: ${jobDescription.company}\n`;
  formattedText += `Location: ${jobDescription.location}\n`;
  
  if (jobDescription.jobType) {
    formattedText += `Job Type: ${jobDescription.jobType}\n\n`;
  }
  
  // Add description
  formattedText += `Description: ${jobDescription.description}\n\n`;
  
  // Add responsibilities if available
  if (jobDescription.responsibilities && jobDescription.responsibilities.length > 0) {
    formattedText += "Responsibilities:\n";
    jobDescription.responsibilities.forEach(resp => {
      formattedText += `- ${resp}\n`;
    });
    formattedText += "\n";
  }
  
  // Add qualifications if available
  if (includeQualifications && jobDescription.qualifications && jobDescription.qualifications.length > 0) {
    formattedText += "Qualifications:\n";
    jobDescription.qualifications.forEach(qual => {
      formattedText += `- ${qual}\n`;
    });
  }
  
  return formattedText;
}

/**
 * Get max tokens based on desired length
 */
export function getMaxTokens(length: 'short' | 'medium' | 'long' | number): number {
  if (typeof length === 'number') return length;
  
  switch (length) {
    case 'short':
      return 300;
    case 'medium':
      return 600;
    case 'long':
      return 1000;
    default:
      return 600;
  }
}

/**
 * Save generated content to a file
 */
export function saveGeneratedContent(
  content: string, 
  type: 'cover_letter' | 'self_introduction', 
  jobDescription: JobDescription,
  format: OutputFormat = OutputFormat.TEXT
): string {
  try {
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().split('T')[0];
    const outputDir = path.join(process.cwd(), 'generated-content');
    
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate safe filename components
    const safeCompany = jobDescription.company.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
    const safeTitle = jobDescription.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
    
    // Set file extension based on format
    let extension = '.txt';
    if (format === OutputFormat.HTML) {
      extension = '.html';
    } else if (format === OutputFormat.MARKDOWN) {
      extension = '.md';
    }
    
    // Create filename
    const typeStr = type === 'cover_letter' ? 'CoverLetter' : 'SelfIntro';
    const filename = `${timestamp}-${safeCompany}-${safeTitle}-${typeStr}${extension}`;
    const fullPath = path.join(outputDir, filename);
    
    // Write to file
    fs.writeFileSync(fullPath, content);
    generatorLogger.log('Saved %s to %s', type, fullPath);
    
    return fullPath;
  } catch (error) {
    generatorLogger.error('Error saving generated content to file: %O', error);
    throw new Error(`Failed to save content: ${error}`);
  }
}

/**
 * Content Generator class for cover letters and self-introductions
 */
export class ContentGenerator {
  private config: OpenAIConfig;
  private client: OpenAI;
  private resumeContent: string | null = null;
  private isResumeLoaded: boolean = false;
  private resumeLoadPromise: Promise<void> | null = null;

  /**
   * Create a new content generator
   */
  constructor(config: Partial<OpenAIConfig> = {}, resumePath?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });
    
    // If resume path is provided, load it asynchronously
    if (resumePath) {
      this.resumeLoadPromise = this.loadResume(resumePath).catch(error => {
        generatorLogger.error('Failed to load resume: %O', error);
      });
    } else {
      this.resumeLoadPromise = Promise.resolve();
    }
  }
  
  /**
   * Load a resume file asynchronously
   */
  async loadResume(resumePath: string): Promise<void> {
    try {
      this.resumeContent = await parseResumeFile(resumePath);
      this.isResumeLoaded = true;
      generatorLogger.log('Loaded resume content from %s', resumePath);
    } catch (error) {
      generatorLogger.error('Failed to load resume: %O', error);
      this.resumeContent = null;
      this.isResumeLoaded = false;
    }
  }
  
  /**
   * Generate a cover letter for a job description
   */
  async generateCoverLetter(
    jobDescription: JobDescription, 
    options: GenerationOptions = {}
  ): Promise<string> {
    const { length = 'medium', format = OutputFormat.TEXT } = options;
    
    generatorLogger.log('Generating cover letter for %s at %s', jobDescription.title, jobDescription.company);
    
    // Wait for resume to be loaded
    if (this.resumeLoadPromise) {
      await this.resumeLoadPromise;
    }
    
    // Format job description
    const jobDescriptionText = formatJobDescription(jobDescription);
    
    generatorLogger.log('Resume loaded: %s', this.isResumeLoaded ? 'Yes' : 'No');
    
    // Use the template
    const prompt = coverLetterPrompt({
      jd: jobDescriptionText,
      resume: this.resumeContent || '',
      companyName: jobDescription.company,
    });
    
    try {
      // Generate content
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: getMaxTokens(length),
      });
      
      const coverLetter = response.choices[0].message.content || '';
      
      generatorLogger.log('Successfully generated cover letter of length: %d characters', coverLetter.length);
      
      // Save the generated cover letter
      saveGeneratedContent(coverLetter, 'cover_letter', jobDescription, format);
      
      return coverLetter;
    } catch (error) {
      generatorLogger.error('Error generating cover letter: %O', error);
      throw new Error(`Failed to generate cover letter: ${error}`);
    }
  }
  
  /**
   * Generate a self-introduction
   */
  async generateSelfIntroduction(
    jobDescription: JobDescription,
    options: GenerationOptions = {}
  ): Promise<string> {
    const { length = 'short', format = OutputFormat.TEXT } = options;
    
    generatorLogger.log('Generating self-introduction for %s at %s', jobDescription.title, jobDescription.company);
    
    // Wait for resume to be loaded
    if (this.resumeLoadPromise) {
      await this.resumeLoadPromise;
    }
    
    // Format job description, but only include qualifications
    const jobDescriptionText = formatJobDescription(jobDescription, false);
    
    // Use the template
    const prompt = selfIntroPrompt({
      jd: jobDescriptionText,
      resume: this.resumeContent || '',
      companyName: jobDescription.company,
    });
    
    try {
      // Generate content
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: getMaxTokens(length),
      });
      
      const selfIntro = response.choices[0].message.content || '';
      
      generatorLogger.log('Successfully generated self-introduction of length: %d characters', selfIntro.length);
      
      // Save the generated self-introduction
      saveGeneratedContent(selfIntro, 'self_introduction', jobDescription, format);
      
      return selfIntro;
    } catch (error) {
      generatorLogger.error('Error generating self-introduction: %O', error);
      throw new Error(`Failed to generate self-introduction: ${error}`);
    }
  }
} 