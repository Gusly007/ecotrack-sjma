import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DesktopLayout from '../components/desktop/DesktopLayout';

const mocks = vi.hoisted(() => ({ user: null }));

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user, logout: vi.fn() }) }));
vi.mock('../context/NotificationContext', () => ({ useNotifications: () => ({ unreadCount: 0, refresh: vi.fn() }) }));
vi.mock('../hooks', () => ({ useNotifications: () => ({ unreadCount: 0, refresh: vi.fn() }) }));
vi.mock('../services/api', () => ({ default: { get: vi.fn().mockResolvedValue({ data: [] }), patch: vi.fn() } }));

afterEach(cleanup);

function headerTitle(role, path) {
  mocks.user = { id_utilisateur: 1, role, prenom: 'Test' };
  render(
    <MemoryRouter initialEntries={[path]}>
      <DesktopLayout><p>contenu</p></DesktopLayout>
    </MemoryRouter>,
  );
  return screen.getByRole('heading', { level: 1 }).textContent;
}

describe('Titre de l’en-tête desktop', () => {
  it.each([
    ['GESTIONNAIRE', '/profile', 'Mon compte'],
    ['ADMIN', '/profile', 'Mon compte'],
    ['GESTIONNAIRE', '/gestionnaire/signalements/1', 'Signalement'],
  ])('%s sur %s affiche « %s »', (role, path, expected) => {
    expect(headerTitle(role, path)).toBe(expected);
  });

  it.each([
    ['GESTIONNAIRE', '/gestionnaire', 'Tableau de bord'],
    ['GESTIONNAIRE', '/gestionnaire/tournees', 'Tournées'],
    ['GESTIONNAIRE', '/gestionnaire/signalements', 'Signalements'],
    ['ADMIN', '/admin/zones', 'Administration'],
  ])('%s sur %s garde « %s »', (role, path, expected) => {
    expect(headerTitle(role, path)).toBe(expected);
  });
});
