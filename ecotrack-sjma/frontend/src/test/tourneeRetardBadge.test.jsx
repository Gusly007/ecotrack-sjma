import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import ToutesTourneesTable from '../components/desktop/gestionnaire/ToutesTourneesTable';
import TourneesActivesPanel from '../components/desktop/gestionnaire/TourneesActivesPanel';
import { fetchAllTournees, fetchActiveTournees } from '../services/tourneeService';

vi.mock('../services/tourneeService', () => ({
  fetchAllTournees: vi.fn(),
  fetchActiveTournees: vi.fn(),
}));

// Sous-composant TourneesEnCoursTable est utilisé par TourneesActivesPanel.
// On le remplace par un stub minimaliste pour cibler uniquement la logique du panel.
vi.mock('../components/desktop/gestionnaire/TourneesEnCoursTable', () => ({
  default: ({ tourneesEnCours }) => (
    <div data-testid="tournees-en-cours-stub">
      {tourneesEnCours.map((t) => (
        <div key={t.id} data-testid={`row-${t.id}`}>
          <span data-testid={`status-${t.id}`}>{t.statusText}</span>
          {t.estEnRetard && <span data-testid={`retard-${t.id}`}>RETARD</span>}
        </div>
      ))}
    </div>
  ),
}));

describe('Affichage du flag est_en_retard (3.9.0)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('ToutesTourneesTable', () => {
    it("affiche le badge 'EN RETARD' uniquement pour les tournées non clôturées", async () => {
      fetchAllTournees.mockResolvedValueOnce({
        data: [
          {
            id_tournee: 1,
            statut: 'EN_COURS',
            est_en_retard: true,
            date_tournee: '2026-04-26',
            agent_prenom: 'Ana',
            agent_nom: 'Diop',
            zone_nom: 'Centre',
            numero_immatriculation: 'AB-123-CD',
            total_etapes: 10,
            etapes_collectees: 3,
          },
          {
            id_tournee: 2,
            statut: 'TERMINEE',
            est_en_retard: true, // backend peut retourner true mais on ne doit PAS afficher
            date_tournee: '2026-04-25',
            agent_prenom: 'Bob',
            agent_nom: 'Sy',
            zone_nom: 'Nord',
            numero_immatriculation: 'CD-456-EF',
            total_etapes: 5,
            etapes_collectees: 5,
          },
          {
            id_tournee: 3,
            statut: 'ANNULEE',
            est_en_retard: true, // idem : ne doit PAS s'afficher
            date_tournee: '2026-04-24',
            agent_prenom: 'Cyril',
            agent_nom: 'Niang',
            zone_nom: 'Sud',
            numero_immatriculation: 'EF-789-GH',
            total_etapes: 4,
            etapes_collectees: 2,
          },
          {
            id_tournee: 4,
            statut: 'PLANIFIEE',
            est_en_retard: false, // pas en retard
            date_tournee: '2026-04-27',
            agent_prenom: 'Dia',
            agent_nom: 'Ka',
            zone_nom: 'Est',
            numero_immatriculation: 'GH-012-IJ',
            total_etapes: 6,
            etapes_collectees: 0,
          },
        ],
        pagination: { page: 1, pages: 1, total: 4, limit: 12 },
      });

      render(<ToutesTourneesTable statusFilter="TOUS" searchTerm="" pageSize={12} />);

      await waitFor(() => expect(screen.getByText('T-1')).toBeInTheDocument());

      // Tournée 1 (EN_COURS + retard) -> badge visible
      const badges = screen.getAllByText(/EN RETARD/i);
      expect(badges).toHaveLength(1);

      // Aucun badge pour les tournées TERMINEE/ANNULEE/non en retard
      expect(screen.queryByText(/EN RETARD/i, { selector: '.tournee-retard-badge' }))
        .toBeInTheDocument();

      // Vérifie statut affiché
      expect(screen.getByText('Terminée')).toBeInTheDocument();
      expect(screen.getByText('Annulée')).toBeInTheDocument();
      expect(screen.getByText('Planifiée')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });

    it('mapStatus reflète strictement le statut métier (plus d\'heuristique progression)', async () => {
      // Tournée à 5% de progression mais EN_COURS et PAS en retard ->
      // ne doit PAS être marquée "en retard" (l'ancien bug qui marquait progression<=20 comme "en retard")
      fetchAllTournees.mockResolvedValueOnce({
        data: [
          {
            id_tournee: 99,
            statut: 'EN_COURS',
            est_en_retard: false,
            date_tournee: '2026-04-26',
            agent_prenom: 'Eva',
            agent_nom: 'Ndiaye',
            zone_nom: 'Centre',
            numero_immatriculation: 'IJ-345-KL',
            total_etapes: 20,
            etapes_collectees: 1, // progression 5%
          },
        ],
        pagination: { page: 1, pages: 1, total: 1, limit: 12 },
      });

      render(<ToutesTourneesTable statusFilter="TOUS" searchTerm="" pageSize={12} />);

      await waitFor(() => expect(screen.getByText('T-99')).toBeInTheDocument());

      expect(screen.getByText('En cours')).toBeInTheDocument();
      expect(screen.queryByText(/EN RETARD/i)).not.toBeInTheDocument();
    });
  });

  describe('TourneesActivesPanel', () => {
    it("propage est_en_retard du backend vers la ligne (et n'utilise plus progression<=20)", async () => {
      fetchActiveTournees.mockResolvedValueOnce({
        data: [
          {
            id_tournee: 10,
            statut: 'EN_COURS',
            est_en_retard: true,
            agent_prenom: 'Fa',
            agent_nom: 'Sow',
            zone_nom: 'Centre',
            total_etapes: 10,
            etapes_collectees: 8,
          },
          {
            id_tournee: 11,
            statut: 'EN_COURS',
            est_en_retard: false, // 5% mais pas en retard -> on ne doit PAS le marquer
            agent_prenom: 'Ga',
            agent_nom: 'Ba',
            zone_nom: 'Nord',
            total_etapes: 20,
            etapes_collectees: 1,
          },
        ],
        pagination: { page: 1, pages: 1, total: 2, limit: 6 },
      });

      render(<TourneesActivesPanel pageSize={6} />);

      await waitFor(() => expect(screen.getByTestId('row-T-10')).toBeInTheDocument());

      expect(screen.getByTestId('retard-T-10')).toBeInTheDocument();
      expect(screen.queryByTestId('retard-T-11')).not.toBeInTheDocument();
    });
  });
});
