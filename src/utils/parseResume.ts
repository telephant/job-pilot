import pdfParse from "pdf-parse";
import fs from 'fs';
import path from 'path';
import { main as generatorLogger } from './debug';

/**
 * Reads and parses a resume file (supports .txt, .pdf)
 * @param filePath Path to the resume file
 * @returns The parsed resume content as text
 */
export async function parseResumeFile(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Resume file not found: ${filePath}`);
  }

  const fileExt = path.extname(filePath).toLowerCase();
  
  try {
    if (fileExt === '.pdf') {
      // Handle PDF files
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text || '';
    } else {
      // Handle text files and other formats as plain text
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    generatorLogger.error('Failed to parse resume file: %O', error);
    throw new Error(`Failed to parse resume file: ${error}`);
  }
}
