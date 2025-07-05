/**
 * Text formatting utilities for converting HTML content to readable text
 */

/**
 * Converts HTML content to clean, readable text
 * @param {string} html - The HTML string to convert
 * @returns {string} - Clean text content
 */
export function htmlToText(html) {
  if (!html) return '';
  
  // Create a temporary element to parse HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // Remove script and style elements completely
  const scripts = tmp.querySelectorAll('script, style');
  scripts.forEach(element => element.remove());
  
  // Replace common HTML elements with readable text equivalents
  const replacements = [
    // Line breaks and paragraphs
    { tag: 'br', replacement: '\n' },
    { tag: 'p', replacement: '\n\n', isBlock: true },
    { tag: 'div', replacement: '\n', isBlock: true },
    
    // Headers
    { tag: 'h1', replacement: '\n\n### ', isBlock: true, suffix: ' ###\n' },
    { tag: 'h2', replacement: '\n\n## ', isBlock: true, suffix: ' ##\n' },
    { tag: 'h3', replacement: '\n\n# ', isBlock: true, suffix: ' #\n' },
    { tag: 'h4', replacement: '\n\n', isBlock: true, suffix: '\n' },
    { tag: 'h5', replacement: '\n\n', isBlock: true, suffix: '\n' },
    { tag: 'h6', replacement: '\n\n', isBlock: true, suffix: '\n' },
    
    // Lists
    { tag: 'ul', replacement: '\n', isBlock: true },
    { tag: 'ol', replacement: '\n', isBlock: true },
    { tag: 'li', replacement: '\n• ', isBlock: true },
    
    // Links
    { tag: 'a', replacement: '', suffix: '' },
    
    // Emphasis
    { tag: 'strong', replacement: '**', suffix: '**' },
    { tag: 'b', replacement: '**', suffix: '**' },
    { tag: 'em', replacement: '*', suffix: '*' },
    { tag: 'i', replacement: '*', suffix: '*' },
    
    // Code
    { tag: 'code', replacement: '`', suffix: '`' },
    { tag: 'pre', replacement: '\n```\n', suffix: '\n```\n', isBlock: true },
    
    // Separators
    { tag: 'hr', replacement: '\n---\n', isBlock: true },
    
    // Tables (basic)
    { tag: 'table', replacement: '\n', isBlock: true },
    { tag: 'tr', replacement: '\n', isBlock: true },
    { tag: 'td', replacement: ' | ', suffix: '' },
    { tag: 'th', replacement: ' | ', suffix: '' },
  ];
  
  // Apply replacements
  replacements.forEach(({ tag, replacement, suffix = '', isBlock = false }) => {
    const elements = tmp.querySelectorAll(tag);
    elements.forEach(element => {
      const content = element.textContent || '';
      const newContent = replacement + content + suffix;
      element.replaceWith(document.createTextNode(newContent));
    });
  });
  
  // Get the cleaned text
  let text = tmp.textContent || tmp.innerText || '';
  
  // Clean up extra whitespace and normalize line breaks
  text = text
    .replace(/\r\n/g, '\n')           // Normalize line endings
    .replace(/\r/g, '\n')             // Convert remaining \r to \n
    .replace(/\n{3,}/g, '\n\n')       // Replace multiple newlines with double
    .replace(/[ \t]+/g, ' ')          // Replace multiple spaces/tabs with single space
    .replace(/[ \t]*\n[ \t]*/g, '\n') // Remove spaces around newlines
    .trim();                          // Remove leading/trailing whitespace
  
  return text;
}

/**
 * Truncates text to a specified length with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Cleans and truncates HTML content for display
 * @param {string} html - The HTML content to process
 * @param {number} maxLength - Maximum length for the cleaned text
 * @returns {string} - Clean, truncated text
 */
export function cleanAndTruncateHtml(html, maxLength = 150) {
  const cleanText = htmlToText(html);
  return truncateText(cleanText, maxLength);
}

/**
 * Formats content for history items with consistent text cleaning
 * @param {Object} item - The history item object
 * @param {number} maxLength - Maximum description length
 * @returns {Object} - Formatted item with clean text
 */
export function formatHistoryItem(item, maxLength = 150) {
  return {
    ...item,
    title: item.title || item.name || 'Untitled',
    description: item.description ? cleanAndTruncateHtml(item.description, maxLength) : '',
    cleanDescription: item.description ? htmlToText(item.description) : ''
  };
}
