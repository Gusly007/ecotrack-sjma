import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal, { ModalConfirmation } from '../../components/common/Modal';
import { FormGroup, Input, Select, Textarea } from '../../components/common/Form';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';

describe('Integration — Form inside Modal interaction', () => {
  it('renders a form inside a modal with all fields', () => {
    render(
      <Modal isOpen={true} title="Créer une zone" onClose={vi.fn()}>
        <FormGroup label="Nom" required>
          <Input value="Zone Test" onChange={vi.fn()} placeholder="Nom de la zone" />
        </FormGroup>
        <FormGroup label="Type">
          <Select
            value="urbain"
            onChange={vi.fn()}
            options={[{ value: 'urbain', label: 'Urbain' }, { value: 'rural', label: 'Rural' }]}
          />
        </FormGroup>
        <FormGroup label="Description">
          <Textarea value="" onChange={vi.fn()} placeholder="Description" rows={3} />
        </FormGroup>
      </Modal>
    );

    expect(screen.getByText('Créer une zone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nom de la zone')).toBeInTheDocument();
    expect(screen.getByText('Urbain')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows alert inside modal on validation error', () => {
    render(
      <Modal isOpen={true} title="Formulaire" onClose={vi.fn()}>
        <Alert type="error" message="Le nom est obligatoire" />
        <FormGroup label="Nom" required>
          <Input value="" onChange={vi.fn()} placeholder="Nom" />
        </FormGroup>
      </Modal>
    );

    expect(screen.getByText('Le nom est obligatoire')).toBeInTheDocument();
    expect(document.querySelector('.alert-message.error')).toBeInTheDocument();
  });

  it('form submit calls handler and closes modal via confirm button', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ModalConfirmation
        isOpen={true}
        title="Supprimer la zone"
        message="Cette action est irréversible. Confirmer la suppression ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        danger={true}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Cette action est irréversible. Confirmer la suppression ?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Supprimer'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('modal close button dismisses the form', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} title="Éditer" onClose={onClose}>
        <FormGroup label="Valeur">
          <Input value="42" onChange={vi.fn()} placeholder="Valeur" />
        </FormGroup>
      </Modal>
    );

    fireEvent.click(document.querySelector('.modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('modal with loading button disables interaction during submit', () => {
    render(
      <Modal
        isOpen={true}
        title="Sauvegarde en cours"
        onClose={vi.fn()}
        showFooter={true}
        footer={
          <Button loading variant="primary">Enregistrement...</Button>
        }
      >
        <p>Veuillez patienter</p>
      </Modal>
    );

    expect(screen.getByText('Sauvegarde en cours')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enregistrement/i })).toBeDisabled();
  });

  it('input change inside modal updates field correctly', () => {
    const onChange = vi.fn();
    render(
      <Modal isOpen={true} title="Edition" onClose={vi.fn()}>
        <FormGroup label="Email">
          <Input
            type="email"
            value="user@example.com"
            onChange={onChange}
            placeholder="Email"
          />
        </FormGroup>
      </Modal>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'nouveau@example.com' }
    });
    expect(onChange).toHaveBeenCalledWith('nouveau@example.com');
  });
});
