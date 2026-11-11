import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationProvider } from '../context/NotificationContext';
import { RoleBasedLayout } from '../components/desktop/RoleBasedLayout';

const mocks = vi.hoisted(() => ({
  user: { id_utilisateur: 3, role: 'GESTIONNAIRE', prenom: 'Gina' },
  unread: 1,
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user, logout: vi.fn() }) }));
vi.mock('../services/api', () => ({ default: { get: mocks.get, patch: mocks.patch } }));
vi.mock('socket.io-client', () => ({
  io: () => ({ on: vi.fn(), disconnect: vi.fn(), connected: false }),
}));

const notification = {
  id_notification: 11,
  titre: 'Conteneur plein',
  corps: 'Zone Nord',
  type: 'ALERTE',
  priorite: 3,
  est_lu: false,
  date_creation: '2026-11-09T10:00:00Z',
};

function storageStub() {
  const store = new Map([['token', 'jwt']]);
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/gestionnaire']}>
      <NotificationProvider>
        <RoleBasedLayout><p>contenu</p></RoleBasedLayout>
      </NotificationProvider>
    </MemoryRouter>,
  );
}

const countCalls = (path) => mocks.get.mock.calls.filter(([url]) => url === path).length;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('localStorage', storageStub());
  vi.stubGlobal('Audio', class {
    dataset = {};
    play() { return Promise.resolve(); }
    pause() {}
  });
  mocks.unread = 1;
  mocks.get.mockReset().mockImplementation(async (url) => {
    if (url.includes('unread')) return { data: { unread_count: mocks.unread } };
    return { data: { data: mocks.unread ? [notification] : [] } };
  });
  mocks.patch.mockReset().mockImplementation(async () => {
    mocks.unread = 0;
    return { data: {} };
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Notifications desktop : un seul compteur', () => {
  it('interroge un seul endpoint de compteur, par un seul timer', async () => {
    renderLayout();
    await act(async () => { await vi.advanceTimersByTimeAsync(62000); });

    expect(countCalls('/notifications/unread-count')).toBe(0);
    // Initial load + one call every 15 s over 62 s.
    expect(countCalls('/api/V1/notifications/unread/count')).toBe(5);
  });

  it('affiche la priorité du menu avec le même libellé que la page', async () => {
    renderLayout();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    fireEvent.click(screen.getByRole('button', { name: 'Notifications gestionnaire' }));

    expect(screen.getByText(/Normale/)).toBeInTheDocument();
    expect(screen.queryByText(/Priorité 3/)).not.toBeInTheDocument();
  });

  it('fait baisser le badge quand une notification est lue depuis le menu', async () => {
    renderLayout();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(document.querySelector('.badge-notif')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'Notifications gestionnaire' }));
    await act(async () => {
      fireEvent.click(screen.getByText('Conteneur plein').closest('button'));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mocks.patch).toHaveBeenCalledWith('/api/V1/notifications/11/read');
    expect(document.querySelector('.badge-notif')).toBeNull();
  });
});
