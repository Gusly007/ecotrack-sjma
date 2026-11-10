import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import FillTrendChart from '../components/desktop/gestionnaire/FillTrendChart';

const mocks = vi.hoisted(() => ({ getFillTrends: vi.fn() }));

vi.mock('../services/analyticsService', () => ({
  analyticsService: { getFillTrends: mocks.getFillTrends },
}));

const LEVELS = [10, 49.9, 50, 50.1, 79.9, 80, 95, 30, 60, 85, 42, 55];

function trends(levels) {
  return levels.map((avgFillLevel, i) => ({
    date: `2026-10-${String(i + 1).padStart(2, '0')}`,
    avgFillLevel,
    measurementCount: 3,
  }));
}

beforeEach(() => {
  mocks.getFillTrends.mockResolvedValue({ data: { trends: trends(LEVELS) } });
});

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('style[data-test-css]').forEach((el) => el.remove());
});

describe('Graphique des 30 jours (KPIs)', () => {
  it('documente dans la légende les seuils exacts appliqués aux barres', async () => {
    render(<FillTrendChart />);

    const legend = await screen.findByRole('list', { name: 'Seuils de couleur' });
    const items = within(legend).getAllByRole('listitem').map((li) => li.textContent.trim());
    expect(items).toEqual([
      'Moins de 50 %',
      'De 50 % à moins de 80 %',
      '80 % et plus',
    ]);

    const tones = [...document.querySelectorAll('.ftc-bar')].map((bar) =>
      ['ok', 'warning', 'danger'].find((tone) => bar.classList.contains(`ftc-bar--${tone}`)),
    );
    expect(tones).toEqual(['ok', 'ok', 'warning', 'warning', 'warning', 'danger', 'danger', 'ok', 'warning', 'danger']);
    expect(screen.getByTitle('49.90 % · 3 mesure(s)')).toBeInTheDocument();
  });

  it('garde une page de barres sur une seule ligne, avec défilement horizontal si nécessaire', async () => {
    const style = document.createElement('style');
    style.dataset.testCss = '';
    style.textContent = readFileSync(
      resolve(cwd(),'src/components/desktop/gestionnaire/FillTrendChart.css'),
      'utf8',
    );
    document.head.appendChild(style);
    render(<FillTrendChart />);

    await screen.findByText('12 points');
    const chart = document.querySelector('.ftc-chart');
    const css = getComputedStyle(chart);
    expect(css.getPropertyValue('grid-auto-flow')).toBe('column');
    expect(css.getPropertyValue('overflow-x')).toBe('auto');
  });

  it('pagine toujours par 10 jours', async () => {
    render(<FillTrendChart />);

    await screen.findByText('12 points');
    expect(document.querySelectorAll('.ftc-col')).toHaveLength(10);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(document.querySelectorAll('.ftc-col')).toHaveLength(2);
  });
});
