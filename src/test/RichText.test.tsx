import { describe, it, expect } from 'vitest'
import { sanitiseRichHtml } from '../components/RichText'

describe('RichText HTML Sanitization (HPR-25)', () => {
  it('strips script tags and dangerous elements', () => {
    const raw = '<p>Selamat datang</p><script>alert("xss")</script><iframe src="http://evil.com"></iframe>'
    const clean = sanitiseRichHtml(raw)
    expect(clean).not.toContain('<script>')
    expect(clean).not.toContain('<iframe>')
    expect(clean).toContain('<p>Selamat datang</p>')
  })

  it('sanitizes href attributes on anchor tags', () => {
    const raw = '<a href="javascript:alert(1)">Klik di sini</a>'
    const clean = sanitiseRichHtml(raw)
    expect(clean).not.toContain('javascript:')
    expect(clean).toContain('href="#"')
    expect(clean).toContain('rel="noopener noreferrer"')
  })

  it('allows safe tags like strong, em, p, ul, li', () => {
    const raw = '<p>Teks <strong>tebal</strong> dan <em>senget</em></p>'
    const clean = sanitiseRichHtml(raw)
    expect(clean).toContain('<strong>tebal</strong>')
    expect(clean).toContain('<em>senget</em>')
  })
})
