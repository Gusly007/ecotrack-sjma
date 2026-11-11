import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScanResult from '../pages/mobile/agent/ScanResult';
import { containerService } from '../services/containerService';
import { fetchMyTournee, recordCollecte } from '../services/tourneeService';

vi.mock('../components/mobile/MobileLayout', () => ({
  default: ({ children }) => <main>{children}</main>,
}));
vi.mock('../services/containerService', () => ({
  containerService: { getByUid: vi.fn() },
}));
vi.mock('../services/tourneeService', () => ({
  fetchMyTournee: vi.fn(),
  recordCollecte: vi.fn(),
}));

const container = { id_conteneur: 101, uid: 'CNT-00101', capacite_l: 1000 };
const noTourneeMessage = 'Aucune tournée active. La collecte ne peut pas être validée.';

function renderScanResult() {
  return render(
    <MemoryRouter initialEntries={['/agent/scan/result/CNT-00101']}>
      <Routes>
        <Route path="/agent/scan/result/:uid" element={<ScanResult />} />
        <Route path="/agent/tournee" element={<p>Tournée de l’agent</p>} />
        <Route path="/agent/tournee/terminer" element={<p>Fin de tournée</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function collecteButton() {
  return screen.findByRole('button', { name: 'Valider la collecte (+10 pts)' });
}

describe('SCRUM-17 — validation de collecte', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    containerService.getByUid.mockResolvedValue(container);
    fetchMyTournee.mockResolvedValue({ id_tournee: 42, statut: 'EN_COURS' });
    recordCollecte.mockResolvedValue({ tournee_terminee: false });
  });

  afterEach(cleanup);

  it.each([null, {}])('désactive la collecte et explique l’absence de tournée (%j)', async (tournee) => {
    fetchMyTournee.mockResolvedValue(tournee);
    renderScanResult();

    const button = await collecteButton();
    expect(button).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(noTourneeMessage);
    expect(button).toHaveAccessibleDescription(noTourneeMessage);
    fireEvent.click(button);
    expect(recordCollecte).not.toHaveBeenCalled();
    expect(screen.queryByText('Collecte enregistrée !')).not.toBeInTheDocument();
  });

  it('conserve le conteneur et explique un échec de chargement de la tournée', async () => {
    fetchMyTournee.mockRejectedValue(new Error('Network Error'));
    renderScanResult();

    expect(await collecteButton()).toBeDisabled();
    expect(screen.getByText(container.uid)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de vérifier la tournée active. Veuillez réessayer.');
    expect(recordCollecte).not.toHaveBeenCalled();
  });

  it('traite le 404 réel de my-tournee comme une absence de tournée', async () => {
    fetchMyTournee.mockRejectedValue({
      response: { status: 404, data: { message: "Aucune tournée assignée aujourd'hui" } },
    });
    renderScanResult();

    expect(await collecteButton()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(noTourneeMessage);
    expect(screen.getByText(container.uid)).toBeInTheDocument();
    expect(recordCollecte).not.toHaveBeenCalled();
  });

  it('attend le chargement de la tournée avant de proposer la validation', async () => {
    let resolveTournee;
    fetchMyTournee.mockReturnValue(new Promise(resolve => { resolveTournee = resolve; }));
    renderScanResult();
    await waitFor(() => expect(fetchMyTournee).toHaveBeenCalledOnce());
    expect(screen.queryByRole('button', { name: /Valider la collecte/ })).not.toBeInTheDocument();

    await act(async () => resolveTournee(null));
    expect(await collecteButton()).toBeDisabled();
  });

  it.each([
    [400, 'Vous n’êtes pas assigné à cette tournée'],
    [404, 'Tournée 42 introuvable'],
  ])('affiche le refus API %i et permet de réessayer', async (status, message) => {
    recordCollecte.mockRejectedValueOnce({ response: { status, data: { message } } });
    renderScanResult();
    fireEvent.click(await collecteButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(await collecteButton()).toBeEnabled();
    expect(screen.queryByText('Collecte enregistrée !')).not.toBeInTheDocument();

    fireEvent.click(await collecteButton());
    await screen.findByText('Collecte enregistrée !');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(recordCollecte).toHaveBeenCalledTimes(2);
  });

  it('affiche un message de repli quand aucune explication API n’est disponible', async () => {
    recordCollecte.mockRejectedValue(new Error('Network Error'));
    renderScanResult();
    fireEvent.click(await collecteButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible d’enregistrer la collecte. Veuillez réessayer.');
    expect(await collecteButton()).toBeEnabled();
    expect(screen.queryByText('Network Error')).not.toBeInTheDocument();
  });

  it.each(['PLANIFIEE', 'EN_COURS'])('préserve la collecte autorisée pour une tournée %s', async (statut) => {
    fetchMyTournee.mockResolvedValue({ id_tournee: 42, statut });
    renderScanResult();
    const button = await collecteButton();
    expect(button).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('kg'), { target: { value: '12.5' } });
    fireEvent.click(button);

    await screen.findByText('Collecte enregistrée !');
    expect(recordCollecte).toHaveBeenCalledExactlyOnceWith(42, {
      id_conteneur: 101,
      quantite_kg: 12.5,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Conteneur suivant' }));
    expect(screen.getByText('Tournée de l’agent')).toBeInTheDocument();
  });

  it('bloque les clics supplémentaires pendant l’enregistrement et préserve la fin de tournée', async () => {
    let resolveCollecte;
    recordCollecte.mockReturnValue(new Promise(resolve => { resolveCollecte = resolve; }));
    renderScanResult();
    fireEvent.click(await collecteButton());
    const pendingButton = screen.getByRole('button', { name: 'Enregistrement...' });
    expect(pendingButton).toBeDisabled();
    fireEvent.click(pendingButton);
    expect(recordCollecte).toHaveBeenCalledOnce();

    await act(async () => resolveCollecte({ tournee_terminee: true }));
    fireEvent.click(screen.getByRole('button', { name: /Tous les conteneurs collectés/ }));
    expect(screen.getByText('Fin de tournée')).toBeInTheDocument();
  });

  it('préserve l’écran de conteneur introuvable', async () => {
    containerService.getByUid.mockRejectedValue(new Error('Not found'));
    renderScanResult();
    await screen.findByText('Conteneur non trouve');
    expect(fetchMyTournee).not.toHaveBeenCalled();
    expect(recordCollecte).not.toHaveBeenCalled();
  });
});
