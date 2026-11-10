// V2-011 — non-régression : aucune réponse contenant des jetons ne doit être
// écrite dans la console lors de la finalisation MFA.
//
// Le composant est rendu en jsdom, authService mocké, et on espionne
// console.log / error / warn / info / debug pendant le flux complet.
//
// Les assertions s'appuient sur le contenu console et sur un marqueur de mode
// volontairement insensible aux accents : le libellé exact du titre ne doit
// pas rendre le test fragile selon l'encodage du runner.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MfaPage from '../pages/auth/MfaPage';

vi.mock('../services/authService', () => ({
  authService: {
    verifyMfaSetup: vi.fn(),
    loginWithMfa: vi.fn(),
    generateMfaSetup: vi.fn(),
  },
}));

vi.mock('../hooks/useAlert', () => ({
  useAlert: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}));

vi.mock('../components/layout/Footer', () => ({
  default: () => null,
}));

import { authService } from '../services/authService';

const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.fake.access.token';
const FAKE_REFRESH = 'eyJhbGciOiJIUzI1NiJ9.fake.refresh.token';
const FAKE_SECRET = 'JBSWY3DPEHPK3PXP';

// Toutes les entrées possibles d'un rendu console, sérialisées en une chaîne.
const flattenConsole = (...spies) =>
  spies
    .flatMap((spy) => spy.mock.calls)
    .flat()
    .map((arg) => {
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return typeof arg === 'string' ? arg : JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' | ');

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/mfa']}>
      <MfaPage />
    </MemoryRouter>
  );

// « Configurer » n'apparaît que dans le titre du mode configuration initiale.
// On ne se base pas sur l'accentuation complète de la phrase.
const isSetupMode = (container) => /Configurer/i.test(container.textContent || '');

describe('MfaPage / fuite de jetons en console', () => {
  let spies;

  const installSpies = () => {
    spies = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  };

  const output = () => flattenConsole(spies.log, spies.error, spies.warn, spies.info, spies.debug);

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mfa_user_id', '42');

    // Login réussi réassigne window.location.href : on stub sans supprimer
    // l'objet global (la suppression est instable selon la version de jsdom).
    vi.stubGlobal('location', { ...window.location, href: '' });

    installSpies();

    authService.loginWithMfa.mockReset();
    authService.verifyMfaSetup.mockReset();
    authService.generateMfaSetup.mockReset();

    authService.loginWithMfa.mockResolvedValue({
      token: FAKE_TOKEN,
      refreshToken: FAKE_REFRESH,
      user: { id: 42, role: 'CITOYEN', email: 'citoyen@ecotrack.fr' },
    });
    authService.verifyMfaSetup.mockResolvedValue({
      token: FAKE_TOKEN,
      refreshToken: FAKE_REFRESH,
      user: { id: 42, role: 'CITOYEN', email: 'citoyen@ecotrack.fr' },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const submitCode = (value) => {
    const input = screen.getByLabelText(/Code de v[eé]rification/i);
    fireEvent.change(input, { target: { value } });
    fireEvent.submit(input.closest('form'));
  };

  describe('verification (loginWithMfa)', () => {
    it('ne journalise ni access token ni refresh token', async () => {
      renderPage();

      submitCode('123456');

      await waitFor(() => {
        expect(authService.loginWithMfa).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(FAKE_TOKEN);
      });

      expect(output()).not.toContain(FAKE_TOKEN);
      expect(output()).not.toContain(FAKE_REFRESH);
    });

    it('ne journalise pas la réponse brute', async () => {
      renderPage();

      submitCode('654321');

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(FAKE_TOKEN);
      });

      const out = output();
      expect(out).not.toContain('Donn');
      expect(out).not.toContain('refreshToken');
      expect(out).not.toContain('accessToken');
    });

    it('ne journalise pas la réponse quand le jeton est absent', async () => {
      authService.loginWithMfa.mockResolvedValueOnce({
        user: { id: 42, role: 'CITOYEN' },
      });

      renderPage();

      submitCode('111111');

      await waitFor(() => {
        expect(authService.loginWithMfa).toHaveBeenCalled();
      });

      expect(output()).not.toContain('refreshToken');
      expect(output()).not.toContain(FAKE_REFRESH);
    });
  });

  describe('configuration initiale (verifyMfaSetup)', () => {
    beforeEach(() => {
      localStorage.setItem(
        'mfa_setup',
        JSON.stringify({
          // `secret` est OBLIGATOIRE : le composant n'active le mode setup que
          // si data.secret ET data.qrCodeUrl sont présents. On utilise ici une
          // valeur de fixture non sensible, distincte de FAKE_SECRET, pour
          // éviter tout stockage en clair d'une valeur marquée comme sensible.
          secret: 'fixture-non-sensitive',
          qrCodeUrl: 'data:image/png;base64,AAAA',
          timestamp: new Date().toISOString(),
        })
      );
    });

    it('le setup frais active bien le mode configuration', async () => {
      const { container } = renderPage();

      await waitFor(() => {
        expect(isSetupMode(container)).toBe(true);
      });
    });

    it('ne journalise ni les jetons ni le secret TOTP', async () => {
      const { container } = renderPage();

      await waitFor(() => {
        expect(isSetupMode(container)).toBe(true);
      });

      submitCode('424242');

      await waitFor(() => {
        expect(authService.verifyMfaSetup).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(FAKE_TOKEN);
      });

      const out = output();
      expect(out).not.toContain(FAKE_TOKEN);
      expect(out).not.toContain(FAKE_REFRESH);
      expect(out).not.toContain(FAKE_SECRET);
      expect(out).not.toContain('Donn');
    });

    it('transmet le secret au service sans le diffuser en console', async () => {
      const { container } = renderPage();

      await waitFor(() => {
        expect(isSetupMode(container)).toBe(true);
      });

      submitCode('999999');

      await waitFor(() => {
        expect(authService.verifyMfaSetup).toHaveBeenCalledWith(42, '999999', 'fixture-non-sensitive');
      });

      expect(output()).not.toContain(FAKE_SECRET);
    });

    it('ne journalise pas la réponse quand le jeton manque', async () => {
      authService.verifyMfaSetup.mockResolvedValueOnce({
        user: { id: 42, role: 'CITOYEN' },
      });

      const { container } = renderPage();

      await waitFor(() => {
        expect(isSetupMode(container)).toBe(true);
      });

      submitCode('121212');

      await waitFor(() => {
        expect(authService.verifyMfaSetup).toHaveBeenCalled();
      });

      const out = output();
      expect(out).not.toContain(FAKE_REFRESH);
      expect(out).not.toContain(FAKE_SECRET);
    });
  });
});