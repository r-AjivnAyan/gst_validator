/**
 * A simple but effective text sanitizer to prevent XSS.
 * It leverages the browser's own parser to encode HTML entities.
 * By setting `textContent`, the browser treats the input as plain text,
 * and when reading `innerHTML`, it returns the HTML-encoded version of that text.
 * e.g., '<script>alert(1)</script>' becomes '&lt;script&gt;alert(1)&lt;/script&gt;'
 * 
 * @param {string | undefined | null} input The potentially unsafe string.
 * @returns {string} The sanitized, HTML-safe string.
 */
export const sanitizeText = (input: string | undefined | null): string => {
    if (!input) return '';
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
};
