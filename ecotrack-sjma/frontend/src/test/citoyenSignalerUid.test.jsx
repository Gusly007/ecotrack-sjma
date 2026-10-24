import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CitoyenSignaler from '../pages/mobile/citoyen/CitoyenSignaler';
import { citoyenService } from '../services/citoyenService';

// V2-078 — l'UID inexistant doit afficher « Conteneur introuvable » en rouge
// et bloquer l'envoi tant que id_conteneur n'est pas résolu.

vi.mock('../services/citoyenService', () => ({
  citoyenService: {
    getSignalementTypes: vi.fn(),
    getContainerByUid: vi.fn(),
    createSignalement: vi.fn(),
  },
}));

const renderSignaler = (state) =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/citoyen/signaler', state }]}
    >
      <CitoyenSignaler />
    </MemoryRouter>
  );

const typeUid = (value) => {
  const input = screen.getByPlaceholderText("Ou saisir l'identifiant (ex: CNT-00012)");
  fireEvent.change(input, { target: { value } });
  return input;
};

describe('CitoyenSignaler — résolution de l\'identifiant conteneur', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    citoyenService.getSignalementTypes.mockResolvedValue([
      { id_type: 1, libelle: 'CONTENEUR_PLEIN' },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche « Conteneur introuvable » en rouge pour un UID inexistant et désactive l\'envoi', async () => {
    citoyenService.getContainerByUid.mockRejectedValue(
      Object.assign(new Error('Conteneur introuvable'), { response: { status: 404, data: { message: 'Conteneur introuvable' } } })
    );

    renderSignaler();
    typeUid('CNT-ZZZ999');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(screen.getByText('Conteneur introuvable — vérifiez l\'identifiant ou scannez le QR code.')).toBeInTheDocument();
    expect(screen.queryByText('Conteneur sélectionné')).not.toBeInTheDocument();

    const typeCard = screen.getByRole('button', { name: /Débordement/i });
    fireEvent.click(typeCard);

    const submit = screen.getByRole('button', { name: /Conteneur à vérifier|Envoyer/i });
    expect(submit).toBeDisabled();
    expect(citoyenService.createSignalement).not.toHaveBeenCalled();
  });

  it('affiche la zone pour un UID valide et permet l\'envoi', async () => {
    citoyenService.getContainerByUid.mockResolvedValue({
      id_conteneur: 12,
      uid: 'CNT-00012',
      id_type: 1,
      id_zone: 1,
    });

    renderSignaler();
    typeUid('CNT-00012');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(screen.getByText('Zone 1 — Ordures ménagères')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Débordement/i }));

    const submit = screen.getByRole('button', { name: /Envoyer le signalement/i });
    expect(submit).toBeEnabled();
  });

  it('n\'appelle pas l\'envoi tant que l\'UID n\'est pas résolu (payload sans id_conteneur refusé côté backend)', async () => {
    citoyenService.getContainerByUid.mockRejectedValue(new Error('Conteneur introuvable'));

    renderSignaler();
    typeUid('CNT-ZZZ999');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    const form = screen.getByRole('button', { name: /Conteneur à vérifier/i }).closest('form');
    fireEvent.submit(form);

    expect(citoyenService.createSignalement).not.toHaveBeenCalled();
  });

  it('état pré-rempli depuis la carte/le scanner : envoi possible directement', async () => {
    renderSignaler({ conteneurUid: 'CNT-00012', id_conteneur: 12, type: 'Ordures ménagères', zone: 'Zone 1' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText('Zone 1 — Ordures ménagères')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Débordement/i }));
    expect(screen.getByRole('button', { name: /Envoyer le signalement/i })).toBeEnabled();
  });
});
