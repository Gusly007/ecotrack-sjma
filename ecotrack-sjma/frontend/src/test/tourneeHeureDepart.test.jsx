import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import TourneePage from '../pages/desktop/gestionnaire/tournee';
import {
  fetchTourneeCreationOptions,
  fetchTourneesStats,
} from '../services/tourneeService';

vi.mock('../services/tourneeService', () => ({
  fetchTourneeCreationOptions: vi.fn(),
  fetchTourneesStats: vi.fn(),
  optimizeTournee: vi.fn(),
  previewOptimizeTournee: vi.fn(),
}));

vi.mock('../components/desktop/gestionnaire/ToutesTourneesTable', () => ({
  default: () => null,
}));

const at = (h, m, day = 9) => new Date(2026, 10, day, h, m, 0);

describe('Modale de création de tournée', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(at(15, 2));
    fetchTourneesStats.mockResolvedValue({ tournees: {} });
    fetchTourneeCreationOptions.mockResolvedValue({
      zones: [], agents: [{ id_utilisateur: 3, prenom: 'Jean', nom: 'Martin', email: 'agent1@ecotrack.local' }], vehicles: [], types: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  async function openModal() {
    render(<TourneePage />);
    fireEvent.click(await screen.findByRole('button', { name: /Créer une tournée/ }));
    await waitFor(() => expect(fetchTourneeCreationOptions).toHaveBeenCalled());
    return {
      date: screen.getByLabelText('Date'),
      heure: screen.getByLabelText(/Heure de départ prévue/),
    };
  }

  it('propose une heure future et 07:30 pour le lendemain', async () => {
    const { date, heure } = await openModal();
    expect(date.value).toBe('2026-11-09');
    expect(heure.value).toBe('15:15');
    expect(screen.queryByText(/déjà passée/)).not.toBeInTheDocument();

    fireEvent.change(date, { target: { name: 'date_tournee', value: '2026-11-10' } });
    expect(heure.value).toBe('07:30');
  });

  it('avertit quand l\'heure saisie est passée, puis retire l\'avertissement', async () => {
    const { heure } = await openModal();

    fireEvent.change(heure, { target: { name: 'heure_debut_prevue', value: '07:30' } });
    expect(screen.getByText(/déjà passée/)).toBeInTheDocument();

    fireEvent.change(heure, { target: { name: 'heure_debut_prevue', value: '16:00' } });
    expect(screen.queryByText(/déjà passée/)).not.toBeInTheDocument();
  });
});
