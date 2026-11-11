import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
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

// Vitest stubs CSS imports, so the stylesheet is injected by hand for jsdom to cascade it.
const tourneeCss = readFileSync(resolve(cwd(),'src/pages/desktop/gestionnaire/tournee.css'), 'utf8');

describe('Modale de création de tournée : mise en page', () => {
  let style;

  beforeEach(() => {
    style = document.createElement('style');
    style.textContent = tourneeCss;
    document.head.appendChild(style);
    fetchTourneesStats.mockResolvedValue({ tournees: {} });
    fetchTourneeCreationOptions.mockResolvedValue({
      zones: [],
      agents: [{ id_utilisateur: 3, prenom: 'Jean', nom: 'Martin', email: 'un.agent.au.nom.tres.long@ecotrack.local' }],
      vehicles: [],
      types: [],
    });
  });

  afterEach(() => {
    cleanup();
    style.remove();
    vi.clearAllMocks();
  });

  async function openModal() {
    render(<TourneePage />);
    fireEvent.click(await screen.findByRole('button', { name: /Créer une tournée/ }));
    await waitFor(() => expect(fetchTourneeCreationOptions).toHaveBeenCalled());
    return screen.getByRole('button', { name: 'Créer et optimiser' }).closest('.tournee-modal-actions');
  }

  it('garde les boutons collés en bas de la zone qui défile', async () => {
    const actions = await openModal();
    const computed = getComputedStyle(actions);
    expect(computed.position).toBe('sticky');
    expect(computed.bottom).toBe('-20px');
    expect(computed.backgroundColor).not.toBe('');
  });

  it('répartit les colonnes à parts égales quel que soit le contenu des listes', async () => {
    await openModal();
    const row = screen.getByLabelText('Agent à assigner').closest('.tournee-modal-row');
    expect(getComputedStyle(row).gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
  });
});
