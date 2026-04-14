import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { Filters, SearchBox, SelectFilter, Button, Modal, ModalConfirmation, useAlert } from '../components/common';

describe('common components', () => {
  describe('Filters', () => {
    it('renders children inside the filters section', () => {
      render(
        <Filters>
          <span>Filter content</span>
        </Filters>
      );

      expect(screen.getByText('Filter content')).toBeInTheDocument();
      expect(screen.getByText('Filter content').closest('.filters-section')).toBeInTheDocument();
    });
  });

  describe('SearchBox', () => {
    it('calls onChange when typing and onSubmit on blur', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(<SearchBox value="abc" onChange={onChange} onSubmit={onSubmit} placeholder="Rechercher un site" />);

      const input = screen.getByPlaceholderText('Rechercher un site');
      fireEvent.change(input, { target: { value: 'new value' } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith('new value');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('blurs and submits when Enter is pressed', () => {
      const onSubmit = vi.fn();

      render(<SearchBox value="abc" onChange={vi.fn()} onSubmit={onSubmit} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      fireEvent.blur(input);

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('SelectFilter', () => {
    it('renders placeholder and options', () => {
      const onChange = vi.fn();

      render(
        <SelectFilter
          value=""
          onChange={onChange}
          placeholder="Tous les statuts"
          options={[
            { value: 'open', label: 'Ouvert' },
            { value: 'closed', label: 'Fermé' }
          ]}
        />
      );

      expect(screen.getByRole('option', { name: 'Tous les statuts' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Ouvert' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Fermé' })).toBeInTheDocument();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'open' } });
      expect(onChange).toHaveBeenCalledWith('open');
    });
  });

  describe('Button', () => {
    it('renders children and icon when not loading', () => {
      render(<Button icon="fa-plus">Ajouter</Button>);

      expect(screen.getByRole('button', { name: /Ajouter/i })).toBeInTheDocument();
      expect(document.querySelector('.fa-plus')).toBeInTheDocument();
    });

    it('renders spinner and disables button when loading', () => {
      render(<Button loading>En cours</Button>);

      const button = screen.getByRole('button', { name: /En cours/i });
      expect(button).toBeDisabled();
      expect(document.querySelector('.fa-spinner')).toBeInTheDocument();
    });
  });

  describe('Modal', () => {
    it('returns null when closed', () => {
      const { container } = render(<Modal isOpen={false} title="Titre" onClose={vi.fn()} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders content and closes on overlay click', () => {
      const onClose = vi.fn();

      render(
        <Modal isOpen onClose={onClose} title="Titre">
          <p>Contenu</p>
        </Modal>
      );

      expect(screen.getByText('Titre')).toBeInTheDocument();
      expect(screen.getByText('Contenu')).toBeInTheDocument();
      expect(screen.getByText('Fermer')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Contenu').closest('.modal-content'));
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText('Contenu').closest('.modal-overlay'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('ModalConfirmation', () => {
    it('calls confirm and closes by default', () => {
      const onClose = vi.fn();
      const onConfirm = vi.fn();

      render(
        <ModalConfirmation
          isOpen
          onClose={onClose}
          onConfirm={onConfirm}
          message="Confirmer l'action ?"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('sets alert and clears it after timeout', () => {
    const { result } = renderHook(() => useAlert());

    act(() => {
      result.current.showSuccess('Succès');
    });

    expect(result.current.alert).toEqual({ type: 'success', message: 'Succès' });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.alert).toBeNull();
  });

  it('clears alert manually', () => {
    const { result } = renderHook(() => useAlert());

    act(() => {
      result.current.showError('Erreur');
      result.current.clearAlert();
    });

    expect(result.current.alert).toBeNull();
  });
});