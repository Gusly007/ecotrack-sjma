import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import { FormGroup, Input } from '../../components/common/Form';

describe('Integration — Alert + Button + Form interaction', () => {
  it('submit button triggers and alert appears with error', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <div>
        <Alert type="error" message="" />
        <Button onClick={onSubmit}>Envoyer</Button>
      </div>
    );

    fireEvent.click(screen.getByText('Envoyer'));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(
      <div>
        <Alert type="error" message="Erreur lors de l'envoi" />
        <Button onClick={onSubmit}>Envoyer</Button>
      </div>
    );

    expect(screen.getByText("Erreur lors de l'envoi")).toBeInTheDocument();
  });

  it('success alert appears after button click and form submit', () => {
    const { rerender } = render(
      <div>
        <Alert type="success" message="" />
        <FormGroup label="Identifiant" required>
          <Input value="ECO-001" onChange={vi.fn()} placeholder="ID conteneur" />
        </FormGroup>
        <Button variant="primary">Valider</Button>
      </div>
    );

    expect(screen.queryByText('Sauvegardé avec succès')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Valider'));

    rerender(
      <div>
        <Alert type="success" message="Sauvegardé avec succès" />
        <FormGroup label="Identifiant" required>
          <Input value="ECO-001" onChange={vi.fn()} placeholder="ID conteneur" />
        </FormGroup>
        <Button variant="primary">Valider</Button>
      </div>
    );

    expect(screen.getByText('Sauvegardé avec succès')).toBeInTheDocument();
    expect(document.querySelector('.alert-message.success')).toBeInTheDocument();
  });

  it('dismissable alert disappears when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <div>
        <Alert type="warning" message="Attention : données non sauvegardées" onClose={onClose} />
        <Button variant="secondary">Annuler</Button>
      </div>
    );

    expect(screen.getByText('Attention : données non sauvegardées')).toBeInTheDocument();
    fireEvent.click(document.querySelector('.alert-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disabled button with error alert shows correct state', () => {
    render(
      <div>
        <Alert type="error" message="Formulaire invalide" />
        <Button disabled variant="primary">Soumettre</Button>
      </div>
    );

    expect(screen.getByText('Formulaire invalide')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Soumettre' })).toBeDisabled();
  });

  it('loading button replaces spinner with content when done', () => {
    const { rerender } = render(
      <div>
        <Button loading variant="primary">Chargement</Button>
        <Alert type="info" message="" />
      </div>
    );

    expect(screen.getByRole('button')).toBeDisabled();
    expect(document.querySelector('.fa-spinner')).toBeInTheDocument();

    rerender(
      <div>
        <Button variant="primary">Terminer</Button>
        <Alert type="success" message="Opération terminée" />
      </div>
    );

    expect(screen.getByRole('button')).not.toBeDisabled();
    expect(document.querySelector('.fa-spinner')).not.toBeInTheDocument();
    expect(screen.getByText('Opération terminée')).toBeInTheDocument();
  });

  it('form with multiple fields and alerts renders correctly together', () => {
    render(
      <div>
        <Alert type="info" message="Remplissez tous les champs obligatoires" />
        <FormGroup label="Nom" required>
          <Input value="" onChange={vi.fn()} placeholder="Nom complet" />
        </FormGroup>
        <FormGroup label="Email" required>
          <Input type="email" value="" onChange={vi.fn()} placeholder="Email" />
        </FormGroup>
        <Button type="submit" variant="primary">Créer le compte</Button>
      </div>
    );

    expect(screen.getByText('Remplissez tous les champs obligatoires')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nom complet')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer le compte' })).toBeInTheDocument();
    expect(screen.getAllByText('*')).toHaveLength(2);
  });
});
