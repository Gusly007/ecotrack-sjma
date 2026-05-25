import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Alert from '../../components/common/Alert';

describe('E2E — Alert user flows', () => {
  it('renders nothing when message is empty', () => {
    const { container } = render(<Alert message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when message is undefined', () => {
    const { container } = render(<Alert />);
    expect(container.firstChild).toBeNull();
  });

  it('renders success alert with message', () => {
    render(<Alert type="success" message="Opération réussie" />);
    const el = document.querySelector('.alert-message.success');
    expect(el).toBeInTheDocument();
    expect(screen.getByText('Opération réussie')).toBeInTheDocument();
  });

  it('renders error alert with message', () => {
    render(<Alert type="error" message="Une erreur est survenue" />);
    expect(document.querySelector('.alert-message.error')).toBeInTheDocument();
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
  });

  it('renders warning alert', () => {
    render(<Alert type="warning" message="Attention !" />);
    expect(document.querySelector('.alert-message.warning')).toBeInTheDocument();
  });

  it('renders info alert by default', () => {
    render(<Alert message="Information" />);
    expect(document.querySelector('.alert-message.info')).toBeInTheDocument();
  });

  it('shows close button when onClose is provided and calls it on click', () => {
    const onClose = vi.fn();
    render(<Alert type="success" message="OK" onClose={onClose} />);
    const closeBtn = document.querySelector('.alert-close');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when onClose is not provided', () => {
    render(<Alert type="info" message="Info sans fermeture" />);
    expect(document.querySelector('.alert-close')).not.toBeInTheDocument();
  });
});
