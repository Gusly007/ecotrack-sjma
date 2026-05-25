import { describe, expect, it } from 'vitest';
import {
  safeImageSrc,
  isValidEmail,
  normalizeText,
  safeErrorMessage,
} from '../utils/security';

// Tests des helpers sécurité côté citoyen (cf. doc §5).

describe('safeImageSrc', () => {
  it('allows http(s) URLs', () => {
    expect(safeImageSrc('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(safeImageSrc('http://example.com/a.png')).toBe('http://example.com/a.png');
  });

  it('allows data:image/* URLs', () => {
    const d1 = 'data:image/png;base64,iVBORw0KGgo=';
    const d2 = 'data:image/jpeg;base64,/9j/4AAQ=';
    const d3 = 'data:image/webp;base64,UklGRiI=';
    expect(safeImageSrc(d1)).toBe(d1);
    expect(safeImageSrc(d2)).toBe(d2);
    expect(safeImageSrc(d3)).toBe(d3);
  });

  it('allows relative paths starting with /', () => {
    expect(safeImageSrc('/avatars/200/35.jpg')).toBe('/avatars/200/35.jpg');
  });

  it('rejects javascript: and other dangerous schemes', () => {
    expect(safeImageSrc('javascript:alert(1)')).toBeNull();
    expect(safeImageSrc('vbscript:msgbox(1)')).toBeNull();
    expect(safeImageSrc('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeImageSrc('file:///etc/passwd')).toBeNull();
  });

  it('rejects non-strings and empty values', () => {
    expect(safeImageSrc(null)).toBeNull();
    expect(safeImageSrc(undefined)).toBeNull();
    expect(safeImageSrc('')).toBeNull();
    expect(safeImageSrc('   ')).toBeNull();
    expect(safeImageSrc(123)).toBeNull();
  });
});

describe('isValidEmail', () => {
  it('accepts typical emails', () => {
    expect(isValidEmail('alice@example.com')).toBe(true);
    expect(isValidEmail('a.b+tag@example.co.uk')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(isValidEmail('plain')).toBe(false);
    expect(isValidEmail('alice@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('alice@example')).toBe(false);
    expect(isValidEmail('alice example.com')).toBe(false);
  });

  it('rejects empty and non-string', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });

  it('rejects emails over 254 chars', () => {
    const long = 'a'.repeat(250) + '@b.co';
    expect(isValidEmail(long)).toBe(false);
  });
});

describe('normalizeText', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeText('  hello   world  ')).toBe('hello world');
    expect(normalizeText('a\n\nb\tc')).toBe('a b c');
  });

  it('truncates to maxLength', () => {
    expect(normalizeText('abcdef', { maxLength: 3 })).toBe('abc');
    expect(normalizeText('hello world', { maxLength: 5 })).toBe('hello');
  });

  it('does not truncate when under limit', () => {
    expect(normalizeText('abc', { maxLength: 10 })).toBe('abc');
  });

  it('handles null/undefined', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });

  it('handles non-strings by stringifying', () => {
    expect(normalizeText(42)).toBe('42');
    expect(normalizeText(true)).toBe('true');
  });
});

describe('safeErrorMessage', () => {
  it('returns clean axios response message', () => {
    const err = { response: { data: { message: 'Email déjà utilisé' } } };
    expect(safeErrorMessage(err)).toBe('Email déjà utilisé');
  });

  it('returns response.data.error if no message', () => {
    const err = { response: { data: { error: 'Conflit' } } };
    expect(safeErrorMessage(err)).toBe('Conflit');
  });

  it('returns err.message if no response', () => {
    const err = new Error('Champ obligatoire manquant');
    // err.message is "Champ obligatoire manquant" — clean, no tech hints
    expect(safeErrorMessage(err)).toBe('Champ obligatoire manquant');
  });

  it('falls back when message contains tech hints', () => {
    expect(safeErrorMessage({ message: 'TypeError: foo.bar is undefined' }, 'fallback')).toBe('fallback');
    expect(safeErrorMessage({ message: 'pg_connect failed: ECONNREFUSED' }, 'fallback')).toBe('fallback');
    expect(safeErrorMessage({ message: 'at /src/foo.js:23' }, 'fallback')).toBe('fallback');
  });

  it('falls back when message too long', () => {
    const long = 'x'.repeat(250);
    expect(safeErrorMessage({ message: long }, 'fallback')).toBe('fallback');
  });

  it('falls back when err is null/empty', () => {
    expect(safeErrorMessage(null, 'fb')).toBe('fb');
    expect(safeErrorMessage(undefined, 'fb')).toBe('fb');
    expect(safeErrorMessage({}, 'fb')).toBe('fb');
  });

  it('accepts a string error directly', () => {
    expect(safeErrorMessage('Adresse email invalide')).toBe('Adresse email invalide');
  });

  it('uses default fallback when none given', () => {
    expect(safeErrorMessage(null)).toMatch(/erreur/i);
  });
});
