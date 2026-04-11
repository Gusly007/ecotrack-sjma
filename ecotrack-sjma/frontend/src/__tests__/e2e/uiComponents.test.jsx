import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Alert,
  StatCard,
  DetailView,
  DetailSection,
  FormGroup,
  FormRow,
  Input,
  Select,
  Textarea,
  ColorPicker,
  Table,
  Pagination
} from '../components/common';

describe('Alert', () => {
  it('renders null when no message is provided', () => {
    const { container } = render(<Alert />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the message and close button', () => {
    const onClose = vi.fn();

    render(<Alert type="success" message="Sauvegardé" onClose={onClose} />);

    expect(screen.getByText('Sauvegardé')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('StatCard', () => {
  it('renders icon, label, value and change', () => {
    render(<StatCard icon="fa-chart-line" label="Taux" value="82%" change="+4%" changeType="positive" />);

    expect(screen.getByText('Taux')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('+4%')).toBeInTheDocument();
    expect(document.querySelector('.fa-chart-line')).toBeInTheDocument();
  });
});

describe('DetailView', () => {
  it('renders items and nested children', () => {
    render(
      <DetailView items={[{ label: 'Nom', value: 'EcoTrack' }, { label: 'Type', value: 'Admin' }]}>
        <span>Bloc additionnel</span>
      </DetailView>
    );

    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByText('EcoTrack')).toBeInTheDocument();
    expect(screen.getByText('Bloc additionnel')).toBeInTheDocument();
  });

  it('renders section title with optional icon', () => {
    render(
      <DetailSection title="Informations" icon="fa-info-circle">
        <span>Détails</span>
      </DetailSection>
    );

    expect(screen.getByText('Informations')).toBeInTheDocument();
    expect(document.querySelector('.fa-info-circle')).toBeInTheDocument();
    expect(screen.getByText('Détails')).toBeInTheDocument();
  });
});

describe('Form helpers', () => {
  it('renders FormGroup required label and FormRow children', () => {
    render(
      <FormRow>
        <FormGroup label="Nom" required>
          <span>Champ</span>
        </FormGroup>
      </FormRow>
    );

    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('Champ')).toBeInTheDocument();
  });

  it('passes changes through Input, Select, Textarea and ColorPicker', () => {
    const onInputChange = vi.fn();
    const onSelectChange = vi.fn();
    const onTextareaChange = vi.fn();
    const onColorChange = vi.fn();

    render(
      <div>
        <Input value="abc" onChange={onInputChange} placeholder="Nom" />
        <Select
          value="green"
          onChange={onSelectChange}
          placeholder="Choisir"
          options={[{ value: 'red', label: 'Rouge' }, { value: 'green', label: 'Vert' }]}
        />
        <Textarea value="texte" onChange={onTextareaChange} placeholder="Description" rows={4} />
        <ColorPicker value="#00ff00" onChange={onColorChange} colors={["#ff0000", "#00ff00"]} />
      </div>
    );

    fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'new name' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'red' } });
    fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'new text' } });
    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onInputChange).toHaveBeenCalledWith('new name');
    expect(onSelectChange).toHaveBeenCalledWith('red');
    expect(onTextareaChange).toHaveBeenCalledWith('new text');
    expect(onColorChange).toHaveBeenCalledWith('#ff0000');
  });
});

describe('Table', () => {
  it('renders empty message when data is empty', () => {
    render(<Table columns={[{ header: 'Nom', accessor: 'name' }]} data={[]} />);

    expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
  });

  it('renders rows and calls onRowClick', () => {
    const onRowClick = vi.fn();
    render(
      <Table
        columns={[
          { header: 'Nom', accessor: 'name' },
          { header: 'Valeur', render: row => row.value.toUpperCase() }
        ]}
        data={[{ id: 1, name: 'EcoTrack', value: 'admin' }]}
        onRowClick={onRowClick}
      />
    );

    expect(screen.getByText('EcoTrack')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();

    fireEvent.click(screen.getByText('EcoTrack').closest('tr'));
    expect(onRowClick).toHaveBeenCalledWith({ id: 1, name: 'EcoTrack', value: 'admin' });
  });
});

describe('Pagination', () => {
  it('renders page navigation and triggers page changes', () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={3}
        totalPages={7}
        onPageChange={onPageChange}
        showingFrom={21}
        showingTo={30}
        totalItems={70}
        label="éléments"
      />
    );

    expect(screen.getByText(/Affichage 21-30 sur 70 éléments/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getAllByRole('button')[6]);

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onPageChange).toHaveBeenCalledWith(4);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});