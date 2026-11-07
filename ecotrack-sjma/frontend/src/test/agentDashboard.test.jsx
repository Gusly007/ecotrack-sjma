import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentDashboard from '../pages/mobile/agent/AgentDashboard';

const mocks = vi.hoisted(() => ({
  user: { id_utilisateur: 7, prenom: 'Ali', role: 'AGENT' },
  unreadCount: 0,
  fetchMyTournee: vi.fn(),
  fetchAgentStats: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('../hooks', () => ({
  useNotifications: () => ({ unreadCount: mocks.unreadCount }),
}));

vi.mock('../services/tourneeService', () => ({
  fetchMyTournee: (...args) => mocks.fetchMyTournee(...args),
  fetchAgentStats: (...args) => mocks.fetchAgentStats(...args),
}));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/agent']}>
      <AgentDashboard />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id_utilisateur: 7, prenom: 'Ali', role: 'AGENT' };
  mocks.unreadCount = 0;
  mocks.fetchAgentStats.mockResolvedValue({
    total_collectes: 12,
    taux_reussite_pct: 92,
    classement: { rang: 2, total_agents: 8 },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SCRUM-18 - AgentDashboard heure de départ et progression réelles', () => {
  it('affiche heure_debut_prevue formatée (HH:MM) et calcule la progression réelle avec total_etapes renvoyé par le SQL', async () => {
    mocks.fetchMyTournee.mockResolvedValue({
      id_tournee: 159,
      code: 'T-2026-159',
      statut: 'EN_COURS',
      zone_nom: 'Centre-Ville',
      type_conteneur: ' Tri sélectif',
      heure_debut_prevue: '07:30:00',
      total_etapes: '3',
      etapes_collectees: '1',
      distance_prevue_km: 12.4,
      duree_prevue_min: 95,
      vehicule: 'AB-123-CD — Benne',
    });

    renderDashboard();

    expect(await screen.findByText('Tournée #T-2026-159')).toBeInTheDocument();
    expect(screen.getByText('07:30')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('utilise le repli heure_debut et nb_etapes lorsque ces champs sont fournis', async () => {
    mocks.fetchMyTournee.mockResolvedValue({
      id_tournee: 160,
      code: 'T-2026-160',
      statut: 'PLANIFIEE',
      heure_debut: '08:15',
      nb_etapes: 4,
      etapes_collectees: 2,
    });

    renderDashboard();

    expect(await screen.findByText('Tournée #T-2026-160')).toBeInTheDocument();
    expect(screen.getByText('08:15')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('affiche 0% et — sans NaN lorsque total_etapes vaut "0" et qu’aucune heure de départ n’est renseignée', async () => {
    mocks.fetchMyTournee.mockResolvedValue({
      id_tournee: 161,
      code: 'T-2026-161',
      statut: 'PLANIFIEE',
      total_etapes: '0',
      etapes_collectees: '0',
    });

    renderDashboard();

    expect(await screen.findByText('Tournée #T-2026-161')).toBeInTheDocument();
    expect(screen.getByText('0/0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it("affiche l'état vide lorsqu'aucune tournée n'est assignée", async () => {
    mocks.fetchMyTournee.mockResolvedValue(null);

    renderDashboard();

    expect(await screen.findByText("Pas de tournée aujourd'hui")).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });
});
