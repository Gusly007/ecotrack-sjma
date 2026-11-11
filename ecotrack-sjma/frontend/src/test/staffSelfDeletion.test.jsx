import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../pages/auth/ProfilePage';
import EditProfilPage from '../pages/mobile/shared/EditProfilPage';

const mocks = vi.hoisted(() => ({
  authUser: { id_utilisateur: 7, role: 'AGENT', prenom: 'Agent' },
  userService: { getProfile: vi.fn() },
  api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../services/userService', () => ({ userService: mocks.userService }));
vi.mock('../services/api', () => ({ default: mocks.api }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.authUser, logout: vi.fn() }) }));
vi.mock('../hooks', () => ({ useAlert: () => ({ showSuccess: vi.fn(), showError: vi.fn() }) }));
vi.mock('../components/mobile/MobileLayout', () => ({ default: ({ children }) => <div>{children}</div> }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() });
  mocks.api.get.mockResolvedValue({ data: {} });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderProfile(role) {
  mocks.userService.getProfile.mockResolvedValue({ prenom: 'Test', nom: 'User', email: 't@test.local', role_par_defaut: role });
  render(<MemoryRouter><ProfilePage /></MemoryRouter>);
  await screen.findByRole('button', { name: /Profil/ });
}

function renderEditProfil(role) {
  mocks.authUser = { id_utilisateur: 7, role, prenom: 'Test' };
  render(<MemoryRouter><EditProfilPage basePath="/agent" /></MemoryRouter>);
}

describe('suppression de son propre compte réservée aux citoyens', () => {
  it.each(['GESTIONNAIRE', 'ADMIN', 'AGENT'])('ProfilePage n’offre pas l’onglet Supprimer à %s', async (role) => {
    await renderProfile(role);
    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Vos points et badges seront supprimés/)).not.toBeInTheDocument();
  });

  it('ProfilePage garde l’onglet Supprimer pour un citoyen', async () => {
    await renderProfile('CITOYEN');
    expect(screen.getByRole('button', { name: /Supprimer/ })).toBeInTheDocument();
  });

  it('EditProfilPage n’offre pas la suppression à un agent', () => {
    renderEditProfil('AGENT');
    expect(screen.queryByRole('button', { name: /Demander la suppression/ })).not.toBeInTheDocument();
  });

  it('EditProfilPage garde la suppression pour un citoyen', () => {
    renderEditProfil('CITOYEN');
    expect(screen.getByRole('button', { name: /Demander la suppression/ })).toBeInTheDocument();
  });
});
