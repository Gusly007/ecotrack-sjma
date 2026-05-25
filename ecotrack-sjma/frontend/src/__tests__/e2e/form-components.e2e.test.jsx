import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormGroup, FormRow, Input, Select, Textarea, ColorPicker } from '../../components/common/Form';

describe('E2E — Form components interaction flows', () => {
  describe('FormGroup', () => {
    it('renders label with required marker', () => {
      render(<FormGroup label="Email" required><input /></FormGroup>);
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders label without required marker', () => {
      render(<FormGroup label="Nom"><input /></FormGroup>);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('renders children without label', () => {
      render(<FormGroup><span>Champ libre</span></FormGroup>);
      expect(screen.getByText('Champ libre')).toBeInTheDocument();
    });
  });

  describe('FormRow', () => {
    it('wraps children in form-row div', () => {
      render(<FormRow><span>A</span><span>B</span></FormRow>);
      const row = document.querySelector('.form-row');
      expect(row).toBeInTheDocument();
      expect(row.children).toHaveLength(2);
    });
  });

  describe('Input', () => {
    it('renders with placeholder', () => {
      render(<Input value="" onChange={vi.fn()} placeholder="Saisir votre nom" />);
      expect(screen.getByPlaceholderText('Saisir votre nom')).toBeInTheDocument();
    });

    it('calls onChange with new value on change', () => {
      const onChange = vi.fn();
      render(<Input value="" onChange={onChange} placeholder="Nom" />);
      fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'Alice' } });
      expect(onChange).toHaveBeenCalledWith('Alice');
    });

    it('is disabled when disabled prop is true', () => {
      render(<Input value="" onChange={vi.fn()} disabled placeholder="Champ" />);
      expect(screen.getByPlaceholderText('Champ')).toBeDisabled();
    });
  });

  describe('Select', () => {
    const options = [
      { value: 'admin', label: 'Administrateur' },
      { value: 'agent', label: 'Agent' }
    ];

    it('renders with placeholder option', () => {
      render(<Select value="" onChange={vi.fn()} options={options} placeholder="Choisir un rôle" />);
      expect(screen.getByText('Choisir un rôle')).toBeInTheDocument();
    });

    it('renders all options', () => {
      render(<Select value="" onChange={vi.fn()} options={options} />);
      expect(screen.getByText('Administrateur')).toBeInTheDocument();
      expect(screen.getByText('Agent')).toBeInTheDocument();
    });

    it('calls onChange with selected value', () => {
      const onChange = vi.fn();
      render(<Select value="" onChange={onChange} options={options} />);
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'agent' } });
      expect(onChange).toHaveBeenCalledWith('agent');
    });

    it('handles empty options array gracefully', () => {
      render(<Select value="" onChange={vi.fn()} options={[]} placeholder="Aucun" />);
      expect(screen.getByText('Aucun')).toBeInTheDocument();
    });
  });

  describe('Textarea', () => {
    it('renders with rows and placeholder', () => {
      render(<Textarea value="" onChange={vi.fn()} placeholder="Description" rows={5} />);
      const ta = screen.getByPlaceholderText('Description');
      expect(ta).toBeInTheDocument();
      expect(ta).toHaveAttribute('rows', '5');
    });

    it('calls onChange with new value', () => {
      const onChange = vi.fn();
      render(<Textarea value="" onChange={onChange} placeholder="Texte" />);
      fireEvent.change(screen.getByPlaceholderText('Texte'), { target: { value: 'Nouveau texte' } });
      expect(onChange).toHaveBeenCalledWith('Nouveau texte');
    });
  });

  describe('ColorPicker', () => {
    it('renders color buttons', () => {
      render(<ColorPicker value="#ff0000" onChange={vi.fn()} colors={['#ff0000', '#00ff00', '#0000ff']} />);
      const buttons = document.querySelectorAll('.color-option');
      expect(buttons).toHaveLength(3);
    });

    it('marks selected color', () => {
      render(<ColorPicker value="#00ff00" onChange={vi.fn()} colors={['#ff0000', '#00ff00']} />);
      const selected = document.querySelector('.color-option.selected');
      expect(selected).toBeInTheDocument();
    });

    it('calls onChange with clicked color', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="" onChange={onChange} colors={['#ff0000', '#00ff00']} />);
      fireEvent.click(document.querySelectorAll('.color-option')[1]);
      expect(onChange).toHaveBeenCalledWith('#00ff00');
    });
  });
});
