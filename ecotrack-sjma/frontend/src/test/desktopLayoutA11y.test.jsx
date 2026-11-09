import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DesktopLayout from '../components/desktop/DesktopLayout';
import { ADMIN_MENU, GESTIONNAIRE_MENU } from '../components/desktop/menuData';

const mocks = vi.hoisted(() => ({ user: null, logout: vi.fn() }));

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user, logout: mocks.logout }) }));
vi.mock('../context/NotificationContext', () => ({ useNotifications: () => ({ unreadCount: 0, refresh: vi.fn() }) }));
vi.mock('../hooks', () => ({ useNotifications: () => ({ unreadCount: 0, refresh: vi.fn() }) }));
vi.mock('../services/api', () => ({ default: { get: vi.fn().mockResolvedValue({ data: [] }), patch: vi.fn() } }));

const layoutCss = readFileSync(resolve(process.cwd(), 'src/components/desktop/DesktopLayout.css'), 'utf8');

let style;

beforeEach(() => {
  // The real stylesheet hides link labels when the sidebar is collapsed.
  style = document.createElement('style');
  style.textContent = layoutCss;
  document.head.appendChild(style);
});

afterEach(() => {
  cleanup();
  style.remove();
});

function renderLayout(role, path) {
  mocks.user = { id_utilisateur: 1, role, prenom: 'Test' };
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DesktopLayout><p>contenu</p></DesktopLayout>
    </MemoryRouter>,
  );
}

const unnamed = (container, role) => within(container).queryAllByRole(role, { name: '' });

describe.each([
  ['GESTIONNAIRE', '/gestionnaire/tournees', GESTIONNAIRE_MENU],
  ['ADMIN', '/admin/zones', ADMIN_MENU],
])('En-tête et sidebar accessibles (%s)', (role, path, menu) => {
  const linkCount = menu.filter((item) => !item.section).length;

  it('aucun bouton de l’en-tête ni lien de la sidebar sans nom, menu ouvert puis replié', () => {
    renderLayout(role, path);
    const header = screen.getByRole('banner');
    const sidebar = screen.getByRole('complementary');

    expect(unnamed(header, 'button')).toHaveLength(0);
    expect(within(sidebar).getAllByRole('link')).toHaveLength(linkCount);
    expect(unnamed(sidebar, 'link')).toHaveLength(0);

    fireEvent.click(within(header).getByRole('button', { name: 'Réduire le menu' }));

    expect(sidebar).toHaveClass('collapsed');
    expect(unnamed(header, 'button')).toHaveLength(0);
    expect(unnamed(sidebar, 'link')).toHaveLength(0);
    expect(within(sidebar).getByRole('link', { name: menu[1].label })).toHaveAttribute('href', menu[1].path);
  });

  it('le bouton de menu garde l’icône fa-bars et annonce son action', () => {
    renderLayout(role, path);
    const toggle = screen.getByRole('button', { name: 'Réduire le menu' });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.querySelector('i')).toHaveClass('fa-bars');

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toBe(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.querySelector('i')).toHaveClass('fa-bars');
  });

  it('le bouton de déconnexion est nommé et déconnecte toujours', () => {
    renderLayout(role, path);
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(mocks.logout).toHaveBeenCalled();
  });
});
