import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Table from '../../components/common/Table';

const columns = [
  { header: 'Nom', accessor: 'name' },
  { header: 'Statut', accessor: 'status' },
  { header: 'Action', render: (row) => <button>Voir {row.name}</button> }
];

const data = [
  { id: 1, name: 'Zone A', status: 'Actif' },
  { id: 2, name: 'Zone B', status: 'Inactif' },
  { id: 3, name: 'Zone C', status: 'Actif' }
];

describe('E2E — Table user flows', () => {
  it('renders column headers', () => {
    render(<Table columns={columns} data={[]} />);
    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('displays empty message when no data', () => {
    render(<Table columns={columns} data={[]} emptyMessage="Aucun résultat" />);
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
  });

  it('uses default empty message', () => {
    render(<Table columns={columns} data={[]} />);
    expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
  });

  it('renders all data rows', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Zone A')).toBeInTheDocument();
    expect(screen.getByText('Zone B')).toBeInTheDocument();
    expect(screen.getByText('Zone C')).toBeInTheDocument();
  });

  it('renders custom cell via render function', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Voir Zone A')).toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<Table columns={columns} data={data} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('Zone B').closest('tr'));
    expect(onRowClick).toHaveBeenCalledWith(data[1]);
  });

  it('adds clickable class when onRowClick is provided', () => {
    const onRowClick = vi.fn();
    render(<Table columns={columns} data={data} onRowClick={onRowClick} />);
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => expect(row).toHaveClass('clickable'));
  });

  it('does not add clickable class when no onRowClick', () => {
    render(<Table columns={columns} data={data} />);
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => expect(row).not.toHaveClass('clickable'));
  });

  it('renders accessor values in cells', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getAllByText('Actif')).toHaveLength(2);
    expect(screen.getByText('Inactif')).toBeInTheDocument();
  });
});
