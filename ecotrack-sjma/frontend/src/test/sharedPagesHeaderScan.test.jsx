import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import Button from '../components/common/Button';
import ScanResult from '../pages/mobile/shared/ScanResult';

const mocks = vi.hoisted(() => ({
  user: null,
  getByUid: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../services/containerService', () => ({
  containerService: { getByUid: mocks.getByUid },
}));
vi.mock('../components/mobile/MobileLayout', () => ({
  default: ({ children }) => <main>{children}</main>,
}));

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('style[data-test-css]').forEach((el) => el.remove());
});

describe('Button partagé dans un en-tête de page', () => {
  it.each(['primary', 'secondary'])('ne reprend pas la pleine largeur des formulaires (variant %s)', (variant) => {
    for (const file of ['../index.css', '../components/common/Button.css']) {
      const style = document.createElement('style');
      style.dataset.testCss = '';
      style.textContent = readFileSync(new URL(file, import.meta.url), 'utf8');
      document.head.appendChild(style);
    }

    render(
      <div className="users-header">
        <h2 className="page-title">Gestion des Zones</h2>
        <Button variant={variant}>Nouvelle zone</Button>
      </div>,
    );

    expect(getComputedStyle(screen.getByRole('button', { name: 'Nouvelle zone' })).width).not.toBe('100%');
  });
});

describe('Résultat de scan partagé', () => {
  function renderScan() {
    return render(
      <MemoryRouter initialEntries={['/scan/result/CNT-00001']}>
        <Routes>
          <Route path="/scan/result/:uid" element={<ScanResult />} />
          <Route path="/gestionnaire/conteneurs" element={<p>Conteneurs gestionnaire</p>} />
          <Route path="/admin/conteneurs" element={<p>Conteneurs admin</p>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  beforeEach(() => {
    mocks.getByUid.mockResolvedValue({ uid: 'CNT-00001', fill_level: 9, capacite_l: 1000 });
  });

  it.each([
    ['GESTIONNAIRE', '/gestionnaire/conteneurs', 'Conteneurs gestionnaire'],
    ['ADMIN', '/admin/conteneurs', 'Conteneurs admin'],
  ])('propose « Voir le conteneur » au rôle %s vers sa page Conteneurs', async (role, href, landing) => {
    mocks.user = { id: 1, role };
    renderScan();

    const link = await screen.findByRole('link', { name: /Voir le conteneur/ });
    expect(link).toHaveAttribute('href', href);
    expect(screen.queryByRole('button', { name: /Signaler un problème/ })).not.toBeInTheDocument();
    await userEvent.click(link);
    expect(await screen.findByText(landing)).toBeInTheDocument();
  });

  it.each(['CITOYEN', 'AGENT'])('ne propose pas de lien Conteneurs au rôle %s', async (role) => {
    mocks.user = { id: 1, role };
    renderScan();

    await screen.findByText('CNT-00001');
    expect(screen.queryByRole('link', { name: /Voir le conteneur/ })).not.toBeInTheDocument();
  });
});
