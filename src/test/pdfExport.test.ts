import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../lib/pdfExport'

describe('PDF Export HTML Sanitization (HPR-03)', () => {
  it('escapes dangerous HTML script tags in report strings', () => {
    const maliciousInput = '<script>alert("xss")</script>'
    const escaped = escapeHtml(maliciousInput)
    expect(escaped).not.toContain('<script>')
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })

  it('escapes quotes and ampersands correctly', () => {
    const input = 'A & B "Test" \'Quote\''
    const escaped = escapeHtml(input)
    expect(escaped).toBe('A &amp; B &quot;Test&quot; &#039;Quote&#039;')
  })

  it('handles null or undefined inputs gracefully', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })
})
