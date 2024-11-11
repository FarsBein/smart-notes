import MarkdownIt from 'markdown-it';

// Initialize markdown-it with desired options
const md = new MarkdownIt({
  html: true,        // Enable HTML tags in source
  linkify: true,     // Autoconvert URL-like text to links
  typographer: true,  // Enable smartypants and other sweet transforms
  breaks: true,      // This ensures single line breaks are preserved
});

/**
 * Converts Markdown to HTML using markdown-it.
 * @param markdown - The Markdown string to convert.
 * @returns The resulting HTML string.
 */
export const parseMarkdown = (markdown: string): string => {
  return md.render(markdown);
}; 