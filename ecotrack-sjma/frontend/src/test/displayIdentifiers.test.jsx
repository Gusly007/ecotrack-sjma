import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import ToutesTourneesTable from '../components/desktop/gestionnaire/ToutesTourneesTable';
import TourneesEnCoursTable from '../components/desktop/gestionnaire/TourneesEnCoursTable';
import AgentsActifsPanel from '../components/desktop/gestionnaire/AgentsActifsPanel';
import TourneeEditModal from '../components/desktop/gestionnaire/TourneeEditModal';
import MaintenancePage from '../pages/desktop/gestionnaire/MaintenancePage';
import {
  fetchActiveTournees,
  fetchAgentsForAssignment,
  fetchAllTournees,
  fetchTourneeById,
  fetchTourneeCreationOptions,
} from '../services/tourneeService';
import { signalementService } from '../services/signalementService';
import { formatConteneurUid, formatTourneeCode } from '../utils/formatters';

vi.mock('../services/tourneeService', () => ({
  fetchAllTournees: vi.fn(),
  fetchActiveTournees: vi.fn(),
  fetchTourneeById: vi.fn(),
  fetchTourneeCreationOptions: vi.fn(),
  fetchAgentsForAssignment: vi.fn(),
  updateTournee: vi.fn(),
  updateTourneeStatut: vi.fn(),
}));

vi.mock('../services/signalementService', () => ({
  signalementService: { getAll: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'GESTIONNAIRE' } }),
}));

const TOURNEE = {
  id_tournee: 157,
  code: 'TD-20261109-61',
  statut: 'EN_COURS',
  date_tournee: '2026-11-09',
  agent_prenom: 'Ana',
  agent_nom: 'Diop',
  zone_nom: 'Centre',
  total_etapes: 4,
  etapes_collectees: 1,
};

const PAGINATION = { page: 1, pages: 1, total: 1, limit: 12 };

describe('Identifiants affichés (tournée et conteneur)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('formatTourneeCode renvoie le code, sinon un repli lisible sans undefined', () => {
    expect(formatTourneeCode(TOURNEE)).toBe('TD-20261109-61');
    expect(formatTourneeCode({ id_tournee: 5 })).toBe('Tournée #5');
    expect(formatTourneeCode({})).toBe('-');
    expect(formatTourneeCode(null)).toBe('-');
  });

  it('formatConteneurUid renvoie l\'uid du conteneur, sinon un repli lisible', () => {
    expect(formatConteneurUid({ id_conteneur: 3464, conteneur_uid: 'CNT-FUTURE-05361' })).toBe('CNT-FUTURE-05361');
    expect(formatConteneurUid({ id_conteneur: 3464, uid_conteneur: 'CNT-00537' })).toBe('CNT-00537');
    expect(formatConteneurUid({ id_conteneur: 3464 })).toBe('Conteneur #3464');
    expect(formatConteneurUid({})).toBe('-');
  });

  it('Toutes les tournées affiche le code de la tournée, pas T-<id>', async () => {
    fetchAllTournees.mockResolvedValueOnce({ data: [TOURNEE], pagination: PAGINATION });

    render(<ToutesTourneesTable statusFilter="TOUS" searchTerm="" pageSize={12} />);

    await waitFor(() => expect(screen.getByText('TD-20261109-61')).toBeInTheDocument());
    expect(screen.queryByText('T-157')).not.toBeInTheDocument();
  });

  it('Tournées en cours et agents actifs utilisent le même repli sans code', async () => {
    const sansCode = { ...TOURNEE, code: undefined };
    fetchActiveTournees.mockResolvedValueOnce({ data: [sansCode], pagination: PAGINATION });

    render(<TourneesEnCoursTable pageSize={6} />);
    await waitFor(() => expect(screen.getByText('Tournée #157')).toBeInTheDocument());
    cleanup();

    render(<AgentsActifsPanel tournees={[sansCode]} />);
    expect(screen.getByText('Tournée #157')).toBeInTheDocument();
    expect(screen.queryByText('T-157')).not.toBeInTheDocument();
  });

  it('la modale de modification titre avec le code de la tournée', async () => {
    fetchTourneeById.mockResolvedValueOnce(TOURNEE);
    fetchTourneeCreationOptions.mockResolvedValueOnce({ agents: [], vehicles: [], zones: [] });

    render(<TourneeEditModal tourneeId={157} isOpen onClose={() => {}} onSuccess={() => {}} />);

    await waitFor(() => expect(screen.getByText('Modifier — TD-20261109-61')).toBeInTheDocument());
    expect(screen.queryByText(/T-157/)).not.toBeInTheDocument();
  });

  it('Maintenance affiche l\'uid du conteneur renvoyé par l\'API, pas CONT-<id>', async () => {
    signalementService.getAll.mockResolvedValueOnce({
      data: [{
        id_signalement: 1,
        type_signalement: 'Débordement',
        statut: 'NOUVEAU',
        urgence: 'ELEVEE',
        id_conteneur: 3464,
        conteneur_uid: 'CNT-FUTURE-05361',
      }],
    });
    fetchAgentsForAssignment.mockResolvedValue([]);

    render(<MaintenancePage />);

    await waitFor(() => expect(screen.getAllByText('CNT-FUTURE-05361').length).toBeGreaterThan(0));
    expect(screen.queryByText('CONT-3464')).not.toBeInTheDocument();
  });
});
