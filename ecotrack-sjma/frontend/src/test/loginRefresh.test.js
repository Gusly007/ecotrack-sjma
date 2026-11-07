// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import { describe, expect, it, vi } from 'vitest';

const frontend = new URL('../../', import.meta.url);
function inlineScript(file) {
  const html = readFileSync(new URL(file, frontend), 'utf8');
  const script = JSDOM.fragment(html).querySelector('script:not([src])');
  if (!script) throw new Error(`Script de redirection introuvable dans ${file}`);
  return script.textContent;
}

describe('SCRUM-12 — rechargement de la connexion sur un hébergement statique', () => {
  it('ne publie aucune page statique qui masque la route React /login', () => {
    expect(existsSync(fileURLToPath(new URL('public/login.html', frontend)))).toBe(false);
  });

  it.each([
    '/ecotrack-sjma/login',
    '/ecotrack-sjma/login?next=%2Fagent#connexion',
  ])('restaure %s après le passage par la page 404', (route) => {
    const location = new URL(route, 'https://example.test');
    const replace = vi.fn();
    const replaceState = vi.fn();
    const sessionStorage = {};

    runInNewContext(inlineScript('public/404.html'), {
      window: { location: { pathname: location.pathname, search: location.search, hash: location.hash, replace } },
      sessionStorage,
    });

    expect(replace).toHaveBeenCalledExactlyOnceWith('/ecotrack-sjma/');
    expect(sessionStorage.redirect).toBe(route);

    const context = {
      window: { location: { href: 'https://example.test/ecotrack-sjma/' }, history: { replaceState } },
      sessionStorage,
    };
    runInNewContext(inlineScript('index.html'), context);

    expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, null, route);
    expect(sessionStorage.redirect).toBeUndefined();
    runInNewContext(inlineScript('index.html'), context);
    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it('préserve une ouverture normale de la SPA sans redirection mémorisée', () => {
    const replaceState = vi.fn();
    runInNewContext(inlineScript('index.html'), {
      window: { location: { href: 'https://example.test/ecotrack-sjma/' }, history: { replaceState } },
      sessionStorage: {},
    });
    expect(replaceState).not.toHaveBeenCalled();
  });
});
