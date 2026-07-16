import DOMPurify from 'dompurify';

/**
 * Lesson and puzzle content is managed data, but it must still be treated as
 * untrusted at the rendering boundary. Keep the formatting useful while
 * excluding scripts, inline handlers, embeds, and arbitrary styles.
 */
export function sanitizeRichContent(content: string | null | undefined): string {
  return DOMPurify.sanitize(content || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h2', 'h3', 'h4', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}
