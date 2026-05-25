import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard, { StatsGrid } from '../../components/common/StatCard';

describe('E2E — StatCard display flows', () => {
  it('renders label and value', () => {
    render(<StatCard icon="fa-chart-bar" label="Collectes" value="142" />);
    expect(screen.getByText('Collectes')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
  });

  it('renders icon class', () => {
    render(<StatCard icon="fa-trash" label="Conteneurs" value="20" />);
    expect(document.querySelector('.fa-trash')).toBeInTheDocument();
  });

  it('applies default green icon color', () => {
    render(<StatCard icon="fa-leaf" label="Eco" value="99" />);
    expect(document.querySelector('.stat-icon.green')).toBeInTheDocument();
  });

  it('applies custom icon color', () => {
    render(<StatCard icon="fa-fire" iconColor="red" label="Alertes" value="3" />);
    expect(document.querySelector('.stat-icon.red')).toBeInTheDocument();
  });

  it('renders change value when provided', () => {
    render(<StatCard icon="fa-arrow-up" label="Points" value="500" change="+50" changeType="positive" />);
    const changeEl = document.querySelector('.stat-change.positive');
    expect(changeEl).toBeInTheDocument();
    expect(changeEl.textContent).toBe('+50');
  });

  it('does not render change element when change is not provided', () => {
    render(<StatCard icon="fa-circle" label="Total" value="10" />);
    expect(document.querySelector('.stat-change')).not.toBeInTheDocument();
  });

  it('renders multiple cards in StatsGrid', () => {
    render(
      <StatsGrid>
        <StatCard icon="fa-users" label="Citoyens" value="120" />
        <StatCard icon="fa-map" label="Zones" value="8" />
        <StatCard icon="fa-trophy" label="Badges" value="45" />
      </StatsGrid>
    );
    expect(screen.getByText('Citoyens')).toBeInTheDocument();
    expect(screen.getByText('Zones')).toBeInTheDocument();
    expect(screen.getByText('Badges')).toBeInTheDocument();
    expect(document.querySelector('.stats-grid')).toBeInTheDocument();
  });

  it('renders negative change type', () => {
    render(<StatCard icon="fa-arrow-down" label="Score" value="75" change="-10" changeType="negative" />);
    expect(document.querySelector('.stat-change.negative')).toBeInTheDocument();
  });
});
