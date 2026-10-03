import DOMPurify from 'dompurify'

/** All user-authored rich text goes through here before it is stored or rendered. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h2', 'ul', 'ol', 'li', 'blockquote', 'span', 'div'],
    ALLOWED_ATTR: [],
  })
}

export function htmlToText(html: string): string {
  const d = document.createElement('div')
  d.innerHTML = sanitizeHtml(html)
  return (d.textContent ?? '').trim()
}
