import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';

const columns = [
  { header: 'Zone', accessor: 'zone' },
  { header: 'Collectes', accessor: 'collectes' },
  { header: 'Taux', accessor: 'taux' }
];

const rows = [
  { id: 1, zone: 'Centre-Ville', collectes: 48, taux: '94%' },
  { id: 2, zone: 'Nord', collectes: 32, taux: '87%' },
  { id: 3, zone: 'Sud', collectes: 27, taux: '79%' }
];

describe('Integration — Dashboard widgets interaction', () => {
  it('renders stat cards and data table together', () => {
    render(
      <div>
        <StatsGrid>
          <StatCard icon="fa-trash" label="Conteneurs actifs" value="142" iconColor="green" />
          <StatCard icon="fa-truck" label="Collectes ce mois" value="107" iconColor="blue" />
          <StatCard icon="fa-exclamation" label="Alertes" value="3" iconColor="red" change="-2" changeType="positive" />
        </StatsGrid>
        <Table columns={columns} data={rows} />
      </div>
    );

    expect(screen.getByText('Conteneurs actifs')).toBeInTheDocument();
    expect(screen.getByText('107')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Centre-Ville')).toBeInTheDocument();
    expect(screen.getByText('Nord')).toBeInTheDocument();
  });

  it('table row click selects the row and stat updates reflect correctly', () => {
    const onRowClick = vi.fn();
    render(
      <div>
        <StatsGrid>
          <StatCard icon="fa-chart-line" label="Sélection" value="Aucune" />
        </StatsGrid>
        <Table columns={columns} data={rows} onRowClick={onRowClick} />
      </div>
    );

    fireEvent.click(screen.getByText('Sud').closest('tr'));
    expect(onRowClick).toHaveBeenCalledWith(rows[2]);
    expect(screen.getByText('Sélection')).toBeInTheDocument();
  });

  it('pagination changes page while stat cards remain stable', () => {
    const onPageChange = vi.fn();
    render(
      <div>
        <StatsGrid>
          <StatCard icon="fa-list" label="Total zones" value="15" />
        </StatsGrid>
        <Table columns={columns} data={rows} />
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={15}
          showingFrom={1}
          showingTo={3}
          label="zones"
          onPageChange={onPageChange}
        />
      </div>
    );

    expect(screen.getByText('Total zones')).toBeInTheDocument();
    expect(screen.getByText(/Affichage 1-3 sur 15 zones/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('empty table shows message while stat cards still render', () => {
    render(
      <div>
        <StatsGrid>
          <StatCard icon="fa-inbox" label="Résultats" value="0" />
        </StatsGrid>
        <Table columns={columns} data={[]} emptyMessage="Aucune zone trouvée" />
      </div>
    );

    expect(screen.getByText('Résultats')).toBeInTheDocument();
    expect(screen.getByText('Aucune zone trouvée')).toBeInTheDocument();
  });

  it('multiple stat cards with changes render in grid together', () => {
    render(
      <StatsGrid>
        <StatCard icon="fa-arrow-up" label="Hausse" value="12" change="+5" changeType="positive" />
        <StatCard icon="fa-arrow-down" label="Baisse" value="3" change="-2" changeType="negative" />
        <StatCard icon="fa-equals" label="Stable" value="7" />
      </StatsGrid>
    );

    expect(document.querySelector('.stats-grid')).toBeInTheDocument();
    expect(document.querySelectorAll('.stat-card')).toHaveLength(3);
    expect(document.querySelector('.stat-change.positive')).toBeInTheDocument();
    expect(document.querySelector('.stat-change.negative')).toBeInTheDocument();
  });
});
