/**
 * Utility functions for displaying generated content in the console
 */

/**
 * Display a preview of generated content in the console
 * @param content The generated content to display
 * @param type The type of content (cover letter or self-introduction)
 * @param title The job title
 * @param company The company name
 * @param previewLength The length of the preview (default: 200 characters)
 */
export function displayGeneratedContent(
  content: string,
  type: 'cover_letter' | 'self_introduction',
  title: string,
  company: string,
  previewLength: number = 200
): void {
  const typeLabel = type === 'cover_letter' ? 'Cover Letter' : 'Self Introduction';
  const emoji = type === 'cover_letter' ? '📝' : '🎤';
  
  console.log(`\n🚀 ${emoji} ${typeLabel} Generated 🚀\n`);
  console.log(`📋 For: ${title} at ${company}`);
  console.log('\n📄 Preview:');
  console.log(content.substring(0, previewLength) + '...');
  console.log('\n💾 Saved to generated-content directory');
}

/**
 * Display completion message after all content has been generated
 */
export function displayCompletionMessage(): void {
  console.log('\n🚀 Content generation complete! 🚀');
  console.log('📁 Check the generated-content directory for the full output');
} 