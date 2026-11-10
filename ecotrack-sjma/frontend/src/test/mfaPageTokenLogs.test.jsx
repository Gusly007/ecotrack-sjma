// V2-011 — non-régression : aucune réponse contenant des jetons ne doit être
// écrite dans la console lors de la finalisation MFA.
//
// Le composant est rendu en environnement jsdom, authService mocké, et on
// espionne console.log / console.error / console.warn pendant le flux complet.

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

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/mfa']}>
      <MfaPage />
    </MemoryRouter>
  );

describe('MfaPage — aucune fuite de jeton en console', () => {
  let logSpy;
  let errorSpy;
  let warnSpy;
  let infoSpy;
  let debugSpy;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mfa_user_id', '42');

    // window.location.href est réassigné après login réussi : on le neutralise.
    delete window.location;
    window.location = { href: '' };

    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    authService.loginWithMfa.mockResolvedValue({
      token: FAKE_TOKEN,
      refreshToken: FAKE_REFRESH,
      user: { id: 42, role: 'CITOYEN', email: 'citoyen@ecotrack.fr' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const allConsoleOutput = () =>
    [...logSpy.mock.calls, ...errorSpy.mock.calls, ...warnSpy.mock.calls, ...infoSpy.mock.calls, ...debugSpy.mock.calls]
      .flat()
      .map((arg) => {
        try {
          return typeof arg === 'string' ? arg : JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' | ');

  it('ne journalise ni l\'access token ni le refresh token après login MFA réussi', async () => {
    renderPage();

    const input = screen.getByLabelText('Code de vérification');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(authService.loginWithMfa).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe(FAKE_TOKEN);
    });

    const output = allConsoleOutput();
    expect(output).not.toContain(FAKE_TOKEN);
    expect(output).not.toContain(FAKE_REFRESH);
  });

  it('ne journalise pas la réponse brute contenant les jetons', async () => {
    renderPage();

    const input = screen.getByLabelText('Code de vérification');
    fireEvent.change(input, { target: { value: '654321' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe(FAKE_TOKEN);
    });

    const output = allConsoleOutput();
    // Aucun marqueur du payload de réponse ne doit subsister
    expect(output).not.toContain('Données reçues pour finalisation');
    expect(output).not.toContain('refreshToken');
    expect(output).not.toContain('accessToken');
  });

  it('ne journalise pas la réponse brute quand le jeton est absent', async () => {
    authService.loginWithMfa.mockResolvedValueOnce({
      user: { id: 42, role: 'CITOYEN' },
    });

    renderPage();

    const input = screen.getByLabelText('Code de vérification');
    fireEvent.change(input, { target: { value: '111111' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(authService.loginWithMfa).toHaveBeenCalled();
    });

    const output = allConsoleOutput();
    expect(output).not.toContain('Aucun jeton');
    expect(output).not.toContain('user');
  });

  // Le flux de configuration initiale passe par verifyMfaSetup. Il transporte
  // lui aussi des jetons (et le secret TOTP) : il doit respecter la même règle.
  describe('flux de configuration initiale (verifyMfaSetup)', () => {
    const FAKE_SECRET = 'JBSWY3DPEHPK3PXP';

    beforeEach(() => {
      // Le composant lit le setup frais depuis localStorage : on le simule
      // pour forcer le mode isSetup au montage.
      localStorage.setItem(
        'mfa_setup',
        JSON.stringify({
          secret: FAKE_SECRET,
          qrCodeUrl: 'data:image/png;base64,AAAA',
          timestamp: new Date().toISOString(),
        })
      );

      authService.verifyMfaSetup.mockResolvedValue({
        token: FAKE_TOKEN,
        refreshToken: FAKE_REFRESH,
        user: { id: 42, role: 'CITOYEN', email: 'citoyen@ecotrack.fr' },
      });
    });

    it('ne journalise ni les jetons ni le secret TOTP après activation MFA', async () => {
      renderPage();

      // En mode setup le titre change : on vérifie qu'on est bien sur ce flux.
      await waitFor(() => {
        expect(screen.getByText(/Configurer l'authentification à deux facteurs/i)).toBeTruthy();
      });

      const input = screen.getByLabelText('Code de vérification');
      fireEvent.change(input, { target: { value: '424242' } });
      fireEvent.submit(input.closest('form'));

      await waitFor(() => {
        expect(authService.verifyMfaSetup).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(FAKE_TOKEN);
      });

      const output = allConsoleOutput();
      expect(output).not.toContain(FAKE_TOKEN);
      expect(output).not.toContain(FAKE_REFRESH);
      expect(output).not.toContain(FAKE_SECRET);
      expect(output).not.toContain('Données reçues pour finalisation');
    });

    it('transmet le secret au service sans le diffuser en console', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/Configurer l'authentification à deux facteurs/i)).toBeTruthy();
      });

      const input = screen.getByLabelText('Code de vérification');
      fireEvent.change(input, { target: { value: '999999' } });
      fireEvent.submit(input.closest('form'));

      await waitFor(() => {
        expect(authService.verifyMfaSetup).toHaveBeenCalledWith(42, '999999', FAKE_SECRET);
      });

      expect(allConsoleOutput()).not.toContain(FAKE_SECRET);
    });

    it('ne journalise pas la réponse brute quand le jeton manque en mode setup', async () => {
      authService.verifyMfaSetup.mockResolvedValueOnce({
        user: { id: 42, role: 'CITOYEN' },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/Configurer l'authentification à deux facteurs/i)).toBeTruthy();
      });

      const input = screen.getByLabelText('Code de vérification');
      fireEvent.change(input, { target: { value: '121212' } });
      fireEvent.submit(input.closest('form'));

      await waitFor(() => {
        expect(authService.verifyMfaSetup).toHaveBeenCalled();
      });

      const output = allConsoleOutput();
      expect(output).not.toContain('Aucun jeton');
      expect(output).not.toContain(FAKE_SECRET);
    });
  });
});