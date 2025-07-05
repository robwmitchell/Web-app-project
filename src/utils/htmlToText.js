/**
 * HTML to Text Conversion Utilities
 * Handles conversion of HTML content to readable plain text for live feeds
 */

/**
 * Convert HTML string to plain text
 * @param {string} html - HTML content to convert
 * @param {Object} options - Conversion options
 * @returns {string} Plain text content
 */
export function htmlToText(html, options = {}) {
  if (!html || typeof html !== 'string') return '';

  const {
    maxLength = 300,
    preserveLineBreaks = true,
    removeExtraSpaces = true,
    removeEmptyLines = true
  } = options;

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Remove script and style elements
  const scriptsAndStyles = tempDiv.querySelectorAll('script, style');
  scriptsAndStyles.forEach(el => el.remove());

  // Get text content
  let text = tempDiv.textContent || tempDiv.innerText || '';

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Process the text
  if (preserveLineBreaks) {
    // Convert <br> tags to line breaks before getting text content
    tempDiv.innerHTML = html.replace(/<br\s*\/?>/gi, '\n');
    text = tempDiv.textContent || tempDiv.innerText || '';
  }

  if (removeExtraSpaces) {
    // Remove extra whitespace but preserve single spaces
    text = text.replace(/[ \t]+/g, ' ');
  }

  if (removeEmptyLines) {
    // Remove empty lines
    text = text.replace(/\n\s*\n/g, '\n');
  }

  // Trim whitespace
  text = text.trim();

  // Truncate if needed
  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  return text;
}

/**
 * Decode HTML entities
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  return tempDiv.textContent || tempDiv.innerText || text;
}

/**
 * Extract summary from HTML content
 * @param {string} html - HTML content
 * @param {number} maxLength - Maximum length of summary
 * @returns {string} Text summary
 */
export function extractSummary(html, maxLength = 150) {
  const text = htmlToText(html, { 
    maxLength: maxLength * 2, // Get more text initially
    preserveLineBreaks: false,
    removeExtraSpaces: true,
    removeEmptyLines: true
  });

  // Find the first sentence or paragraph
  const sentences = text.split(/[.!?]+/);
  let summary = sentences[0];

  // If first sentence is too short, add the second one
  if (summary.length < 50 && sentences.length > 1) {
    summary += '. ' + sentences[1];
  }

  // Truncate if still too long
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  return summary.trim();
}

/**
 * Clean and format feed item description
 * @param {string} description - Raw description (may contain HTML)
 * @param {Object} options - Formatting options
 * @returns {string} Cleaned and formatted description
 */
export function formatFeedDescription(description, options = {}) {
  const {
    maxLength = 200,
    preferSummary = true
  } = options;

  if (!description) return '';

  // Check if content contains HTML
  const hasHtml = /<[^>]*>/g.test(description);

  if (hasHtml) {
    if (preferSummary) {
      return extractSummary(description, maxLength);
    } else {
      return htmlToText(description, { maxLength });
    }
  } else {
    // Plain text - just clean and truncate
    let text = description.trim();
    
    if (text.length > maxLength) {
      text = text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
    }
    
    return text;
  }
}

/**
 * Format feed item title (remove HTML if present)
 * @param {string} title - Raw title
 * @returns {string} Clean title
 */
export function formatFeedTitle(title) {
  if (!title) return '';

  // Remove HTML tags and decode entities
  const cleanTitle = htmlToText(title, {
    maxLength: 100,
    preserveLineBreaks: false,
    removeExtraSpaces: true
  });

  return cleanTitle;
}

/**
 * Detect if content is HTML
 * @param {string} content - Content to check
 * @returns {boolean} True if content contains HTML tags
 */
export function isHtmlContent(content) {
  if (!content || typeof content !== 'string') return false;
  return /<[^>]*>/g.test(content);
}

/**
 * Get readable text preview from any content
 * @param {string} content - Content to preview
 * @param {number} maxLength - Maximum length
 * @returns {string} Readable preview
 */
export function getReadablePreview(content, maxLength = 150) {
  if (!content) return '';

  if (isHtmlContent(content)) {
    return extractSummary(content, maxLength);
  } else {
    let text = content.trim();
    if (text.length > maxLength) {
      text = text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
    }
    return text;
  }
}

export default {
  htmlToText,
  extractSummary,
  formatFeedDescription,
  formatFeedTitle,
  isHtmlContent,
  getReadablePreview
};
