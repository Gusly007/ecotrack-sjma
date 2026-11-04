import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AgentDashboard from '../pages/mobile/agent/AgentDashboard';
import StatsPage from '../pages/mobile/agent/StatsPage';
import HistoriquePage from '../pages/mobile/agent/HistoriquePage';

const mocks = vi.hoisted(() => ({
  user: { id_utilisateur: 7, role: 'AGENT', prenom: 'Agent' },
  fetchMyTournee: vi.fn(),
  fetchAgentStats: vi.fn(),
  fetchAgentHistory: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../services/tourneeService', () => mocks);
vi.mock('../hooks', () => ({ useNotifications: () => ({ unreadCount: 0 }) }));
vi.mock('../hooks/useNotifications', () => ({ useNotifications: () => ({ unreadCount: 0 }) }));
vi.mock('../hooks/useNotificationSound', () => ({ useNotificationSound: () => ({ play: vi.fn() }) }));

function renderAgent(path = '/agent') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/agent" element={<AgentDashboard />} />
        <Route path="/agent/stats" element={<StatsPage />} />
        <Route path="/agent/historique" element={<HistoriquePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchMyTournee.mockResolvedValue(null);
  mocks.fetchAgentStats.mockResolvedValue({ total_tournees: 1 });
  mocks.fetchAgentHistory.mockResolvedValue({
    data: [{ id_tournee: 42, code: 'TOURNEE-TEST', statut: 'TERMINEE' }],
  });
});

afterEach(cleanup);

describe('SCRUM-19 - accès à l’historique des tournées', () => {
  it('atteint l’historique en deux clics depuis l’accueil sans tournée active', async () => {
    const user = userEvent.setup();
    renderAgent();
    await screen.findByText("Pas de tournée aujourd'hui");

    await user.click(screen.getByRole('button', { name: 'Stats' }));
    await user.click(await screen.findByRole('link', { name: 'Historique des tournées' }));

    expect(await screen.findByText('TOURNEE-TEST')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Historique' })).toBeInTheDocument();
    expect(mocks.fetchAgentHistory).toHaveBeenCalledWith(7);

    await user.click(screen.getByRole('button', { name: 'Stats' }));
    expect(await screen.findByRole('heading', { name: 'Mes Statistiques' })).toBeInTheDocument();
  });

  it.each(['chargement', 'erreur', 'vide'])('garde l’accès disponible avec les statistiques en état %s', async (state) => {
    if (state === 'chargement') mocks.fetchAgentStats.mockReturnValue(new Promise(() => {}));
    if (state === 'erreur') mocks.fetchAgentStats.mockRejectedValue(new Error('Service indisponible'));
    if (state === 'vide') mocks.fetchAgentStats.mockResolvedValue({});
    const user = userEvent.setup();
    renderAgent('/agent/stats');

    const link = await screen.findByRole('link', { name: 'Historique des tournées' });
    expect(link).toHaveAttribute('href', '/agent/historique');
    await user.click(link);

    expect(await screen.findByText('TOURNEE-TEST')).toBeInTheDocument();
  });

  it('permet l’activation au clavier et affiche l’état vide de l’historique', async () => {
    mocks.fetchAgentHistory.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderAgent('/agent/stats');

    const link = await screen.findByRole('link', { name: 'Historique des tournées' });
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Aucun historique')).toBeInTheDocument();
    expect(mocks.fetchAgentHistory).toHaveBeenCalledWith(7);
  });
});
