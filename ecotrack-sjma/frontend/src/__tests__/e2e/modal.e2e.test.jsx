import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal, { ModalConfirmation } from '../../components/common/Modal';

describe('E2E — Modal user flows', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<Modal isOpen={false} title="Test" onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and children when open', () => {
    render(
      <Modal isOpen={true} title="Mon Modal" onClose={vi.fn()}>
        <p>Contenu du modal</p>
      </Modal>
    );
    expect(screen.getByText('Mon Modal')).toBeInTheDocument();
    expect(screen.getByText('Contenu du modal')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} title="Test" onClose={onClose}><span>x</span></Modal>);
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside modal content', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} title="Test" onClose={onClose}><span>inner</span></Modal>);
    fireEvent.click(document.querySelector('.modal-content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} title="Test" onClose={onClose}><span>x</span></Modal>);
    fireEvent.click(document.querySelector('.modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom footer', () => {
    render(
      <Modal isOpen={true} title="T" onClose={vi.fn()} footer={<button>Sauvegarder</button>}>
        <span>body</span>
      </Modal>
    );
    expect(screen.getByText('Sauvegarder')).toBeInTheDocument();
  });

  it('hides footer when showFooter is false', () => {
    render(
      <Modal isOpen={true} title="T" onClose={vi.fn()} showFooter={false}>
        <span>body</span>
      </Modal>
    );
    expect(screen.queryByText('Fermer')).not.toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} title="T" onClose={vi.fn()} showCloseButton={false}>
        <span>body</span>
      </Modal>
    );
    expect(document.querySelector('.modal-close')).not.toBeInTheDocument();
  });
});

describe('E2E — ModalConfirmation flows', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ModalConfirmation isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} message="Sûr?" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders message and action buttons', () => {
    render(
      <ModalConfirmation
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        message="Supprimer cet élément ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        danger={true}
      />
    );
    expect(screen.getByText('Supprimer cet élément ?')).toBeInTheDocument();
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm button clicked', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ModalConfirmation
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirmer l'action"
        confirmText="Valider"
        message="OK?"
      />
    );
    fireEvent.click(screen.getByText('Valider'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls only onClose when cancel button clicked', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ModalConfirmation isOpen={true} onClose={onClose} onConfirm={onConfirm} message="OK?" />
    );
    fireEvent.click(screen.getByText('Annuler'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
