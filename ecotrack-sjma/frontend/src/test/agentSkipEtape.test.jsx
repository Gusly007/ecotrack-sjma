import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EtapeDetail from '../pages/mobile/agent/EtapeDetail';
import TourneePage from '../pages/mobile/agent/TourneePage';
import { setEtapeIgnored } from '../services/agentTourneeSession';

const mocks = vi.hoisted(() => ({
  user: { id_utilisateur: 7, role: 'AGENT' },
  tournee: { id_tournee: 42, statut: 'EN_COURS' },
  etapes: [],
  fetchMyTournee: vi.fn(),
  fetchEtapes: vi.fn(),
  fetchEtapeById: vi.fn(),
  recordCollecte: vi.fn(),
  changeStatut: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../services/tourneeService', () => mocks);
vi.mock('../components/mobile/MobileLayout', () => ({
  default: ({ children, title }) => <main><h1>{title}</h1>{children}</main>,
}));
vi.mock('../components/mobile/MapView', () => ({
  default: () => null,
  markerIcons: { red: 'red', blue: 'blue', orange: 'orange', green: 'green' },
}));

function renderTournee(path = '/agent/tournee') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/agent/tournee" element={<TourneePage />} />
        <Route path="/agent/tournee/etape/:id" element={<EtapeDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  document.documentElement.lang = 'fr';
  mocks.user = { id_utilisateur: 7, role: 'AGENT' };
  mocks.tournee = { id_tournee: 42, statut: 'EN_COURS' };
  mocks.etapes = [1, 2, 3].map(id => ({
    id_etape: id, id_tournee: 42, id_conteneur: id + 100,
    sequence: id, conteneur_uid: `CNT-${id}`, collectee: false,
  }));
  mocks.fetchMyTournee.mockImplementation(async () => mocks.tournee);
  mocks.fetchEtapes.mockImplementation(async () => mocks.etapes);
  mocks.fetchEtapeById.mockImplementation(async id => mocks.etapes.find(e => e.id_etape === Number(id)));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SCRUM-16 - passer une étape', () => {
  it('affiche le conteneur suivant après Passer, même après rechargement, sans créer de collecte', async () => {
    const user = userEvent.setup();
    const page = renderTournee('/agent/tournee/etape/1');
    await user.click(await screen.findByRole('button', { name: 'Passer' }));
    await screen.findByText('Prochain conteneur');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-2');
    expect(within(screen.getByRole('region', { name: 'Étapes ignorées' })).getByText('CNT-1')).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
    expect(mocks.recordCollecte).not.toHaveBeenCalled();
    expect(mocks.changeStatut).not.toHaveBeenCalled();

    page.unmount();
    renderTournee();
    await screen.findByText('Prochain conteneur');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-2');
  });

  it('exclut les étapes déjà collectées et ignorées sans fausser la progression', async () => {
    mocks.etapes[0].collectee = true;
    const user = userEvent.setup();
    renderTournee('/agent/tournee/etape/2');
    await user.click(await screen.findByRole('button', { name: 'Passer' }));
    await screen.findByText('Prochain conteneur');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-3');
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.queryByText("File d'attente")).not.toBeInTheDocument();
    expect(mocks.etapes[1].collectee).toBe(false);
  });

  it('permet de reprendre au clavier la dernière étape ignorée sans terminer la tournée', async () => {
    mocks.etapes = mocks.etapes.slice(0, 1);
    const user = userEvent.setup();
    renderTournee('/agent/tournee/etape/1');
    await user.click(await screen.findByRole('button', { name: 'Passer' }));
    expect(await screen.findByText('Aucun autre conteneur à proposer')).toBeInTheDocument();
    expect(screen.queryByText('Prochain conteneur')).not.toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
    expect(mocks.recordCollecte).not.toHaveBeenCalled();
    expect(mocks.changeStatut).not.toHaveBeenCalled();

    const resume = screen.getByRole('button', { name: 'Reprendre cette étape : CNT-1' });
    resume.focus();
    await user.keyboard('{Enter}');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-1');
    expect(screen.queryByRole('region', { name: 'Étapes ignorées' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('isole les étapes ignorées par agent et par tournée', async () => {
    setEtapeIgnored(7, 42, 1);
    mocks.user = { id_utilisateur: 8, role: 'AGENT' };
    const page = renderTournee();
    await screen.findByText('Prochain conteneur');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-1');
    page.unmount();

    mocks.user = { id_utilisateur: 7, role: 'AGENT' };
    mocks.tournee = { id_tournee: 43, statut: 'EN_COURS' };
    renderTournee();
    await screen.findByText('Prochain conteneur');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-1');
  });

  it('privilégie une collecte confirmée par le serveur à un choix local antérieur', async () => {
    setEtapeIgnored(7, 42, 1);
    mocks.etapes[0].collectee = true;
    renderTournee();
    await screen.findByText('Prochain conteneur');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-2');
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Étapes ignorées' })).not.toBeInTheDocument();
  });

  it('désactive Passer sur une étape collectée', async () => {
    mocks.etapes[0].collectee = true;
    renderTournee('/agent/tournee/etape/1');
    expect(await screen.findByRole('button', { name: 'Passer' })).toBeDisabled();
    expect(screen.getByText('Collectée')).toBeInTheDocument();
  });

  it('affiche le statut ignoré à la réouverture du détail', async () => {
    setEtapeIgnored(7, 42, 1);
    renderTournee('/agent/tournee/etape/1');
    expect(await screen.findByRole('button', { name: 'Ignorée' })).toBeDisabled();
    expect(screen.getAllByText('Ignorée')).toHaveLength(2);
  });

  it('reste sur le détail avec une erreur visible si la mémorisation échoue', async () => {
    const user = userEvent.setup();
    renderTournee('/agent/tournee/etape/1');
    const skip = await screen.findByRole('button', { name: 'Passer' });
    vi.spyOn(Object.getPrototypeOf(sessionStorage), 'setItem').mockImplementation(() => { throw new Error('storage unavailable'); });
    await user.click(skip);
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de mémoriser ce choix');
    expect(screen.getByRole('heading', { name: "Détail de l'étape" })).toBeInTheDocument();
    expect(mocks.recordCollecte).not.toHaveBeenCalled();
  });

  it('signale une lecture de stockage impossible sans masquer les conteneurs', async () => {
    vi.spyOn(Object.getPrototypeOf(sessionStorage), 'getItem').mockImplementation(() => { throw new Error('storage unavailable'); });
    renderTournee();
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de retrouver les étapes ignorées');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-1');
  });

  it('conserve une étape ignorée si sa reprise ne peut pas être mémorisée', async () => {
    setEtapeIgnored(7, 42, 1);
    const user = userEvent.setup();
    renderTournee();
    const resume = await screen.findByRole('button', { name: 'Reprendre cette étape : CNT-1' });
    vi.spyOn(Object.getPrototypeOf(sessionStorage), 'removeItem').mockImplementation(() => { throw new Error('storage unavailable'); });
    await user.click(resume);
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de mémoriser ce choix');
    expect(document.querySelector('.next-etape-card')).toHaveTextContent('CNT-2');
    expect(resume).toBeInTheDocument();
  });

  it('fournit les nouveaux libellés en anglais lorsque la page utilise cette langue', async () => {
    document.documentElement.lang = 'en';
    const user = userEvent.setup();
    renderTournee('/agent/tournee/etape/1');
    await user.click(await screen.findByRole('button', { name: 'Skip' }));
    expect(await screen.findByRole('region', { name: 'Skipped stops' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume this stop : CNT-1' })).toBeInTheDocument();
  });
});
