import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieBanner from '../components/common/CookieBanner';
import api from '../services/api';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const STORAGE_KEY = 'cookieConsent';
const TITLE = 'Gestion des cookies';
const ALL_COOKIES = { functional: true, analytics: true, marketing: true };
const FUNCTIONAL_ONLY = { functional: true, analytics: false, marketing: false };

const storedConsent = () => JSON.parse(localStorage.getItem(STORAGE_KEY));
const seedConsent = (overrides = {}) =>
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ sessionId: 'session_1', status: 'ACCEPTED', cookies: ALL_COOKIES, pending: true, ...overrides })
  );

const createStorage = () => {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    clear: () => items.clear(),
  };
};

beforeEach(() => {
  // Node 25 exposes its own localStorage global, without clear(), over the jsdom one.
  vi.stubGlobal('localStorage', createStorage());
  vi.stubGlobal('sessionStorage', createStorage());
  api.get.mockReset();
  api.post.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CookieBanner', () => {
  it('closes and keeps the choice as pending when the consent API is down', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));
    render(<CookieBanner />);

    await userEvent.click(await screen.findByRole('button', { name: 'Accepter tout' }));

    await waitFor(() => expect(screen.queryByText(TITLE)).not.toBeInTheDocument());
    expect(storedConsent()).toMatchObject({ status: 'ACCEPTED', cookies: ALL_COOKIES, pending: true });
  });

  it('closes without waiting for the consent API to answer', async () => {
    api.post.mockReturnValue(new Promise(() => {}));
    render(<CookieBanner />);

    await userEvent.click(await screen.findByRole('button', { name: 'Refuser tout' }));

    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    expect(storedConsent()).toMatchObject({ status: 'REJECTED', pending: true });
  });

  it('stays closed on reload without asking the server when a choice is stored', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));
    api.get.mockRejectedValue(new Error('Network Error'));
    sessionStorage.setItem('sessionId', 'session_1');
    seedConsent();

    render(<CookieBanner />);

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('sends a pending choice once on load and clears the pending state', async () => {
    api.post.mockResolvedValue({ status: 200 });
    seedConsent();

    render(
      <StrictMode>
        <CookieBanner />
      </StrictMode>
    );

    await waitFor(() => expect(storedConsent().pending).toBe(false));
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/api/V1/cookies/consent', {
      session_id: 'session_1',
      consent_status: 'ACCEPTED',
      cookies_accepted: ALL_COOKIES,
    });
  });

  it('keeps the choice pending when the retry fails, without looping', async () => {
    api.post.mockRejectedValue(Object.assign(new Error('Service Unavailable'), { response: { status: 503 } }));
    seedConsent();

    render(<CookieBanner />);

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(storedConsent().pending).toBe(true);
  });

  it('does not send anything on load once the choice is synced', async () => {
    seedConsent({ pending: false });

    render(<CookieBanner />);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(api.post).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });

  it.each([
    ['Accepter tout', 'ACCEPTED', ALL_COOKIES],
    ['Refuser tout', 'REJECTED', FUNCTIONAL_ONLY],
  ])('saves the choice made with "%s" when the API answers', async (label, status, cookies) => {
    api.post.mockResolvedValue({ status: 200 });
    render(<CookieBanner />);

    await userEvent.click(await screen.findByRole('button', { name: label }));

    await waitFor(() => expect(storedConsent()).toMatchObject({ status, cookies, pending: false }));
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith(
      '/api/V1/cookies/consent',
      expect.objectContaining({ consent_status: status, cookies_accepted: cookies })
    );
  });

  it('shows the banner when no choice is known', async () => {
    render(<CookieBanner />);

    expect(await screen.findByText(TITLE)).toBeInTheDocument();
  });

  it('shows the banner when the server has no consent for the session', async () => {
    sessionStorage.setItem('sessionId', 'session_2');
    api.get.mockRejectedValue(Object.assign(new Error('Not Found'), { response: { status: 404 } }));

    render(<CookieBanner />);

    expect(await screen.findByText(TITLE)).toBeInTheDocument();
  });
});
