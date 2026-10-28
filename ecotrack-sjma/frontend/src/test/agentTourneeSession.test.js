import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getIgnoredEtapes, setEtapeIgnored } from '../services/agentTourneeSession';

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('navigation des étapes ignorées', () => {
  it('normalise les identifiants API et permet de reprendre une étape', () => {
    expect(getIgnoredEtapes(7, 42)).toEqual([]);
    setEtapeIgnored(7, 42, 1);
    setEtapeIgnored('7', '42', '1');
    setEtapeIgnored(7, 42, 2);
    expect(getIgnoredEtapes(7, 42)).toEqual(['1', '2']);
    expect(setEtapeIgnored(7, 42, 1, false)).toEqual(['2']);
    expect(setEtapeIgnored(7, 42, 2, false)).toEqual([]);
    expect(sessionStorage.length).toBe(0);
  });

  it.each([undefined, null, '', 0, -1, '1.2', 'abc', Number.MAX_SAFE_INTEGER + 1])(
    'refuse le contexte ou une étape invalide (%s) sans écrire', invalid => {
      expect(() => setEtapeIgnored(invalid, 42, 1)).toThrow();
      expect(() => setEtapeIgnored(7, invalid, 1)).toThrow();
      expect(() => setEtapeIgnored(7, 42, invalid)).toThrow();
      expect(sessionStorage.length).toBe(0);
    },
  );

  it.each(['{broken', '{}', '[null]', '[-1]', '["abc"]'])(
    'signale les données invalides (%s) sans les écraser silencieusement', raw => {
      setEtapeIgnored(7, 42, 1);
      const key = sessionStorage.key(0);
      sessionStorage.setItem(key, raw);
      expect(() => getIgnoredEtapes(7, 42)).toThrow();
      expect(() => setEtapeIgnored(7, 42, 2)).toThrow();
      expect(sessionStorage.getItem(key)).toBe(raw);
    },
  );
});
