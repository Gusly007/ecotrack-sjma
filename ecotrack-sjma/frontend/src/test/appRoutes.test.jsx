import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import { UnauthorizedPage } from '../pages/errors/ErrorPages';

// Rend la vraie table de routes d'App (SCRUM-14). Seuls l'authentification,
// les layouts et les pages lourdes sont simulés.

const mockAuth = vi.hoisted(() => ({ current: { isAuthenticated: false, user: null, loading: false } }));

vi.mock('../context/AuthContext', async (importOriginal) => ({
  ...(await importOriginal()),
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuth.current,
}));
vi.mock('../context/NotificationContext', async (importOriginal) => ({
  ...(await importOriginal()),
  NotificationProvider: ({ children }) => children,
}));
vi.mock('../components/common/CookieBanner', () => ({ default: () => null }));
vi.mock('../components/desktop/RoleBasedLayout', () => ({
  RoleBasedLayout: ({ children }) => <div data-testid="desktop-layout">{children}</div>,
}));
vi.mock('../pages/desktop/gestionnaire/GestionnaireDashboard', () => ({
  default: () => <p>Dashboard gestionnaire</p>,
}));
vi.mock('../pages/mobile/citoyen/auth/CitoyenAuthContext', async (importOriginal) => ({
  ...(await importOriginal()),
  CitoyenAuthProvider: ({ children }) => children,
}));
vi.mock('../components/mobile/citoyen/CitoyenProtectedRoute', () => ({
  CitoyenProtectedRoute: ({ children }) => children,
}));
vi.mock('../pages/mobile/citoyen/UnreadCountContext', async (importOriginal) => ({
  ...(await importOriginal()),
  UnreadCountProvider: ({ children }) => children,
}));
vi.mock('../pages/mobile/citoyen/MobileLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return { default: () => <div data-testid="citoyen-layout"><Outlet /></div> };
});
vi.mock('../pages/mobile/citoyen/CitoyenHome', () => ({ default: () => <p>Accueil citoyen</p> }));

const renderAt = (path, auth = { isAuthenticated: false, user: null }) => {
  mockAuth.current = { loading: false, ...auth };
  window.history.pushState({}, '', path);
  return render(<App />);
};

afterEach(() => {
  cleanup();
});

describe('Routes inconnues et accès refusé (SCRUM-14)', () => {
  it('une URL inconnue affiche la page 404 au lieu d’une page blanche', async () => {
    renderAt('/n-importe-quoi');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/');
  });

  it('une URL inconnue sous /agent affiche la page 404', async () => {
    renderAt('/agent/n-importe-quoi', { isAuthenticated: true, user: { role: 'AGENT' } });

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  });

  it('/gestionnaire/xyz affiche la 404 dans le layout desktop, plus le dashboard', async () => {
    renderAt('/gestionnaire/n-importe-quoi', { isAuthenticated: true, user: { role: 'GESTIONNAIRE' } });

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard gestionnaire')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/gestionnaire');
  });

  it('/gestionnaire seul affiche toujours le dashboard', async () => {
    renderAt('/gestionnaire', { isAuthenticated: true, user: { role: 'GESTIONNAIRE' } });

    expect(await screen.findByText('Dashboard gestionnaire')).toBeInTheDocument();
  });

  it('/citoyen/xyz affiche la 404 dans le layout citoyen, plus l’accueil', async () => {
    renderAt('/citoyen/n-importe-quoi');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(screen.getByTestId('citoyen-layout')).toBeInTheDocument();
    expect(screen.queryByText('Accueil citoyen')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/citoyen');
  });

  it('/citoyen seul affiche toujours l’accueil citoyen', async () => {
    renderAt('/citoyen');

    expect(await screen.findByText('Accueil citoyen')).toBeInTheDocument();
  });

  it('/unauthorized est lisible et renvoie vers l’espace de l’utilisateur', async () => {
    renderAt('/unauthorized', { isAuthenticated: true, user: { role: 'GESTIONNAIRE' } });

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
    expect(screen.getByText("Votre compte n'a pas accès à cette page.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à mon espace' })).toHaveAttribute('href', '/');
  });

  it('le lien de /unauthorized reste dans l’application quand elle est servie sous un sous-chemin', () => {
    render(
      <MemoryRouter basename="/ecotrack-sjma" initialEntries={['/ecotrack-sjma/unauthorized']}>
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </MemoryRouter>
    );

    const href = screen.getByRole('link', { name: 'Retour à mon espace' }).getAttribute('href');
    expect(href).toMatch(/^\/ecotrack-sjma\/?$/);
  });
});
