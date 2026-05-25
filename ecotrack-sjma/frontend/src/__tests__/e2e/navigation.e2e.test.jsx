import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '../../components/mobile/citoyen/BottomNav';

const renderWithRouter = (ui, { initialEntries = ['/citoyen'] } = {}) =>
  render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);

describe('E2E — BottomNav navigation', () => {
  it('renders all five nav items', () => {
    renderWithRouter(<BottomNav />);
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Carte')).toBeInTheDocument();
    expect(screen.getByText('Defis')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
    // FAB button has no label
    expect(document.querySelector('.mobile-nav-fab')).toBeInTheDocument();
  });

  it('marks the active route', () => {
    renderWithRouter(<BottomNav />, { initialEntries: ['/citoyen'] });
    const accueil = screen.getByText('Accueil').closest('button');
    expect(accueil).toHaveClass('active');
  });

  it('does not mark inactive routes as active', () => {
    renderWithRouter(<BottomNav />, { initialEntries: ['/citoyen'] });
    const profil = screen.getByText('Profil').closest('button');
    expect(profil).not.toHaveClass('active');
  });

  it('navigates on button click', () => {
    renderWithRouter(<BottomNav />, { initialEntries: ['/citoyen'] });
    fireEvent.click(screen.getByText('Profil'));
    // After click the profil route becomes active
    const profil = screen.getByText('Profil').closest('button');
    expect(profil).toHaveClass('active');
  });

  it('marks /citoyen/defis route as active on defis path', () => {
    renderWithRouter(<BottomNav />, { initialEntries: ['/citoyen/defis'] });
    const defis = screen.getByText('Defis').closest('button');
    expect(defis).toHaveClass('active');
  });
});
