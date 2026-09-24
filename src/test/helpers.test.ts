import { describe, it, expect } from 'vitest'
import { sanitizeUrl, checkTimeOverlap, formatTime12Hour, timeToMinutes } from '../lib/helpers'

describe('Helper Utilities (HPR-18, HPR-25)', () => {
  describe('sanitizeUrl', () => {
    it('sanitizes javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('#')
      expect(sanitizeUrl('JAVASCRIPT:void(0)')).toBe('#')
    })

    it('sanitizes data: and vbscript: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#')
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('#')
    })

    it('allows valid https and internal URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
      expect(sanitizeUrl('/e-aset')).toBe('/e-aset')
    })
  })

  describe('checkTimeOverlap (HPR-07)', () => {
    it('detects overlapping time ranges correctly', () => {
      // Slot 1: 09:00 - 11:00, Slot 2: 10:00 - 12:00 -> Overlap
      expect(checkTimeOverlap('09:00', '11:00', '10:00', '12:00')).toBe(true)
    })

    it('returns false for adjacent non-overlapping time ranges', () => {
      // Slot 1: 09:00 - 11:00, Slot 2: 11:00 - 13:00 -> No overlap
      expect(checkTimeOverlap('09:00', '11:00', '11:00', '13:00')).toBe(false)
    })

    it('returns false for completely separate time ranges', () => {
      expect(checkTimeOverlap('08:00', '09:00', '14:00', '15:00')).toBe(false)
    })
  })

  describe('formatTime12Hour', () => {
    it('formats 24-hour time to 12-hour AM/PM string', () => {
      expect(formatTime12Hour('09:00')).toBe('9:00 AM')
      expect(formatTime12Hour('14:30')).toBe('2:30 PM')
      expect(formatTime12Hour('00:15')).toBe('12:15 AM')
      expect(formatTime12Hour('12:00')).toBe('12:00 PM')
    })
  })

  describe('timeToMinutes', () => {
    it('converts HH:MM strings to total minutes', () => {
      expect(timeToMinutes('01:30')).toBe(90)
      expect(timeToMinutes('12:00')).toBe(720)
    })
  })
})
