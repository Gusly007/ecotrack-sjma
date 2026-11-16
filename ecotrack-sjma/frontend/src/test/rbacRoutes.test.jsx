// V2-004 — RBAC des routes frontend.
//
// Reproduit le défaut constaté en live : un AGENT ouvrait /admin et
// /gestionnaire, un GESTIONNAIRE ouvrait /admin/users. Les routes doivent
// désormais porter un requiredRole explicite et rediriger vers /unauthorized.
//
// On monte App réel (mocks ciblés des pages et des contextes) pour tester le
// câblage de App.jsx, pas seulement le composant ProtectedRoute.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null,
  loading: false,
}));

// App monte ses pages via React.lazy : les mocks ci-dessous doivent utiliser
// les chemins réels des import() déclarés dans App.jsx.
const stubPage = vi.hoisted(() => {
  return (name) => {
    const React = require('react');
    return {
      default: function StubPage() {
        return React.createElement('div', { 'data-testid': 'page-' + name }, name);
      },
    };
  };
});

const routerState = vi.hoisted(() => ({ initialEntries: ['/'] }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    login: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    refreshUser: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../context/NotificationContext', () => ({
  NotificationProvider: ({ children }) => children,
  useNotifications: () => ({ unreadCount: 0, refresh: vi.fn() }),
}));

vi.mock('../pages/mobile/citoyen/auth/CitoyenAuthContext', () => ({
  CitoyenAuthProvider: ({ children }) => children,
  useCitoyenAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    logout: vi.fn(),
  }),
}));

vi.mock('../pages/desktop/admin/Dashboard', () => stubPage('admin-dashboard'));
vi.mock('../pages/desktop/admin/Users', () => stubPage('admin-users'));
vi.mock('../pages/desktop/admin/CreateUser', () => stubPage('admin-create-user'));
vi.mock('../pages/desktop/admin/UserDetail', () => stubPage('admin-user-detail'));
vi.mock('../pages/desktop/admin/Roles', () => stubPage('admin-roles'));
vi.mock('../pages/desktop/admin/Zones', () => stubPage('admin-zones'));
vi.mock('../pages/desktop/admin/Conteneurs', () => stubPage('admin-conteneurs'));
vi.mock('../pages/desktop/admin/Signalements', () => stubPage('admin-signalements'));
vi.mock('../pages/desktop/admin/SignalementDetail', () => stubPage('admin-signalement-detail'));
vi.mock('../pages/desktop/admin/Alerts', () => stubPage('admin-alerts'));
vi.mock('../pages/desktop/admin/Logs', () => stubPage('admin-logs'));
vi.mock('../pages/desktop/admin/Monitoring', () => stubPage('admin-monitoring'));
vi.mock('../pages/desktop/admin/Configuration', () => stubPage('admin-config'));
vi.mock('../pages/desktop/gestionnaire/GestionnaireDashboard', () => stubPage('gestionnaire-dashboard'));
vi.mock('../pages/desktop/gestionnaire/tournee', () => stubPage('gestionnaire-tournees'));
vi.mock('../pages/desktop/gestionnaire/SuiviTempsReelPage', () => stubPage('gestionnaire-suivi'));
vi.mock('../pages/desktop/gestionnaire/KpiPage', () => stubPage('gestionnaire-kpis'));
vi.mock('../pages/desktop/gestionnaire/RapportsPage', () => stubPage('gestionnaire-rapports'));
vi.mock('../pages/desktop/gestionnaire/MaintenancePage', () => stubPage('gestionnaire-maintenance'));
vi.mock('../pages/desktop/NotificationsPage', () => stubPage('desktop-notifications'));
vi.mock('../pages/mobile/shared/ProfilPage', () => stubPage('agent-profile'));
vi.mock('../pages/auth/ProfilePage', () => stubPage('desktop-profile'));

vi.mock('../components/desktop/RoleBasedLayout', () => ({
  RoleBasedLayout: ({ children }) => <div data-testid="layout">{children}</div>,
}));

vi.mock('../pages/mobile/citoyen/CitoyenHome', () => stubPage('citoyen-home'));

vi.mock('../pages/mobile/citoyen/MobileLayout', () => ({
  default: () => <div data-testid="citoyen-layout" />,
}));

vi.mock('../pages/mobile/citoyen/UnreadCountContext', () => ({
  UnreadCountProvider: ({ children }) => children,
}));

vi.mock('../components/common/CookieBanner', () => ({ default: () => null }));

// App monte son propre BrowserRouter : on le remplace par un MemoryRouter pour
// piloter l'URL initiale sans toucher à l'historique jsdom.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  const React = await import('react');
  return {
    ...actual,
    BrowserRouter: ({ children }) =>
      React.createElement(actual.MemoryRouter, { initialEntries: routerState.initialEntries }, children),
  };
});

import App from '../App';

const renderAt = (path) => {
  routerState.initialEntries = [path];
  return render(<App />);
};

// Les pages passent par React.lazy derrière un <Suspense> : les assertions
// doivent attendre la résolution du module avant de lire le DOM.
const expectPage = async (name) => {
  await waitFor(() => {
    expect(screen.getByTestId(`page-${name}`)).toBeTruthy();
  });
};

const expectForbidden = async () => {
  await waitFor(() => {
    const body = document.body.textContent || '';
    expect(/403|accès refusé|non autorisé/i.test(body)).toBe(true);
  });
};

const expectNoPage = (name) => {
  expect(screen.queryByTestId(`page-${name}`)).toBeNull();
};

const loginAs = (role) => {
  authState.isAuthenticated = true;
  authState.user = { id: 1, role, email: `${role.toLowerCase()}@ecotrack.fr` };
};

const logout = () => {
  authState.isAuthenticated = false;
  authState.user = null;
};

beforeEach(() => {
  logout();
  authState.loading = false;
});

afterEach(() => {
  cleanup();
});

describe('V2-004 /admin/* — contrôle de rôle', () => {
  it('ADMIN accède au dashboard admin', async () => {
    loginAs('ADMIN');
    renderAt('/admin');
    await expectPage('admin-dashboard');
  });

  it('GESTIONNAIRE accède au dashboard admin (écran partagé D2)', async () => {
    loginAs('GESTIONNAIRE');
    renderAt('/admin');
    await expectPage('admin-dashboard');
  });

  it('AGENT est redirigé vers la page 403 sur /admin', async () => {
    loginAs('AGENT');
    renderAt('/admin');
    expectNoPage('admin-dashboard');
    await expectForbidden();
  });

  it('CITOYEN est redirigé vers la page 403 sur /admin', async () => {
    loginAs('CITOYEN');
    renderAt('/admin');
    expectNoPage('admin-dashboard');
    await expectForbidden();
  });

  it('GESTIONNAIRE est redirigé sur /admin/users (users:read réservé à ADMIN)', async () => {
    loginAs('GESTIONNAIRE');
    renderAt('/admin/users');
    expectNoPage('admin-users');
    await expectForbidden();
  });

  it('AGENT est redirigé sur /admin/users', async () => {
    loginAs('AGENT');
    renderAt('/admin/users');
    expectNoPage('admin-users');
    await expectForbidden();
  });

  it('ADMIN accède à /admin/users', async () => {
    loginAs('ADMIN');
    renderAt('/admin/users');
    await expectPage('admin-users');
  });

  it.each([
    ['/admin/roles', 'admin-roles'],
    ['/admin/logs', 'admin-logs'],
    ['/admin/monitoring', 'admin-monitoring'],
    ['/admin/config', 'admin-config'],
    ['/admin/users/create', 'admin-create-user'],
  ])('GESTIONNAIRE est redirigé sur %s (réservé ADMIN)', async (path, testid) => {
    loginAs('GESTIONNAIRE');
    renderAt(path);
    expectNoPage(testid);
    await expectForbidden();
  });

  it.each([
    ['/admin/zones', 'admin-zones'],
    ['/admin/conteneurs', 'admin-conteneurs'],
    ['/admin/signalements', 'admin-signalements'],
    ['/admin/alerts', 'admin-alerts'],
  ])('GESTIONNAIRE accède à %s (écran partagé D2)', async (path, testid) => {
    loginAs('GESTIONNAIRE');
    renderAt(path);
    await expectPage(testid);
  });
});

describe('V2-004 /gestionnaire/* — contrôle de rôle', () => {
  it('GESTIONNAIRE accède au dashboard gestionnaire', async () => {
    loginAs('GESTIONNAIRE');
    renderAt('/gestionnaire');
    await expectPage('gestionnaire-dashboard');
  });

  it('ADMIN accède au dashboard gestionnaire (écran partagé D2)', async () => {
    loginAs('ADMIN');
    renderAt('/gestionnaire');
    await expectPage('gestionnaire-dashboard');
  });

  it('AGENT est redirigé vers la page 403 sur /gestionnaire', async () => {
    loginAs('AGENT');
    renderAt('/gestionnaire');
    expectNoPage('gestionnaire-dashboard');
    await expectForbidden();
  });

  it('CITOYEN est redirigé vers la page 403 sur /gestionnaire', async () => {
    loginAs('CITOYEN');
    renderAt('/gestionnaire');
    expectNoPage('gestionnaire-dashboard');
    await expectForbidden();
  });

  it.each([
    ['/gestionnaire/tournees', 'gestionnaire-tournees'],
    ['/gestionnaire/suivi', 'gestionnaire-suivi'],
    ['/gestionnaire/kpis', 'gestionnaire-kpis'],
    ['/gestionnaire/rapports', 'gestionnaire-rapports'],
    ['/gestionnaire/maintenance', 'gestionnaire-maintenance'],
  ])('AGENT est redirigé sur %s', async (path, testid) => {
    loginAs('AGENT');
    renderAt(path);
    expectNoPage(testid);
    await expectForbidden();
  });

  it.each([
    ['/gestionnaire/tournees', 'gestionnaire-tournees'],
    ['/gestionnaire/kpis', 'gestionnaire-kpis'],
  ])('GESTIONNAIRE accède à %s', async (path, testid) => {
    loginAs('GESTIONNAIRE');
    renderAt(path);
    await expectPage(testid);
  });
});

describe('V2-004 /citoyen/* — contrôle de rôle', () => {
  it('CITOYEN accède à /citoyen', async () => {
    loginAs('CITOYEN');
    renderAt('/citoyen');
    await waitFor(() => {
      expect(screen.getByTestId('citoyen-layout')).toBeTruthy();
    });
  });

  it.each(['AGENT', 'ADMIN', 'GESTIONNAIRE'])('%s est redirigé vers la page 403 sur /citoyen', async (role) => {
    loginAs(role);
    renderAt('/citoyen');
    expect(screen.queryByTestId('citoyen-layout')).toBeNull();
    await expectForbidden();
  });

  it('un visiteur non authentifié ne voit pas le layout citoyen', async () => {
    logout();
    renderAt('/citoyen');
    await waitFor(() => {
      expect(screen.queryByTestId('citoyen-layout')).toBeNull();
    });
  });
});
describe('V2-004 /profile — chaque rôle consulte son propre profil', () => {
  it('CITOYEN accède au profil desktop (racine /profile)', async () => {
    loginAs('CITOYEN');
    renderAt('/profile');
    await expectPage('desktop-profile');
  });

  it('GESTIONNAIRE accède au profil desktop', async () => {
    loginAs('GESTIONNAIRE');
    renderAt('/profile');
    await expectPage('desktop-profile');
  });

  it('ADMIN accède au profil desktop', async () => {
    loginAs('ADMIN');
    renderAt('/profile');
    await expectPage('desktop-profile');
  });

  it('AGENT est redirigé sur /profile (son profil est /agent/profil)', async () => {
    loginAs('AGENT');
    renderAt('/profile');
    expectNoPage('desktop-profile');
    await expectForbidden();
  });

  it('AGENT accède bien à son propre profil /agent/profil', async () => {
    loginAs('AGENT');
    renderAt('/agent/profil');
    await expectPage('agent-profile');
  });

  it('un visiteur non authentifié est renvoyé vers /login', async () => {
    logout();
    renderAt('/profile');
    await waitFor(() => {
      expect(screen.queryByTestId('page-desktop-profile')).toBeNull();
    });
  });
});
