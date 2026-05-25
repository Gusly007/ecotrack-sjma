import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../components/common/Button';

describe('E2E — Button states and interactions', () => {
  it('renders primary button with label', () => {
    render(<Button>Envoyer</Button>);
    const btn = screen.getByRole('button', { name: 'Envoyer' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('btn-primary');
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Annuler</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });

  it('renders danger variant', () => {
    render(<Button variant="danger">Supprimer</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Désactivé</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled and shows spinner when loading', () => {
    render(<Button loading>Chargement</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('btn-loading');
    expect(document.querySelector('.fa-spinner')).toBeInTheDocument();
  });

  it('calls onClick when clicked and not disabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Cliquer</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Désactivé</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with icon when not loading', () => {
    render(<Button icon="fa-check">Valider</Button>);
    expect(document.querySelector('.fa-check')).toBeInTheDocument();
  });

  it('does not show icon when loading', () => {
    render(<Button icon="fa-check" loading>Chargement</Button>);
    expect(document.querySelector('.fa-check')).not.toBeInTheDocument();
    expect(document.querySelector('.fa-spinner')).toBeInTheDocument();
  });

  it('renders submit type button', () => {
    render(<Button type="submit">Soumettre</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applies size class', () => {
    render(<Button size="lg">Grand</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-lg');
  });
});
