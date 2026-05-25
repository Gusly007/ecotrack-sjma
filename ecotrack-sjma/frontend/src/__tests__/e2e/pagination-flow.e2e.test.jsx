import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../../components/common/Pagination';

describe('E2E — Pagination navigation flows', () => {
  it('renders page count summary for single page', () => {
    render(<Pagination currentPage={1} totalPages={1} totalItems={5} label="conteneurs" />);
    expect(screen.getByText(/5 conteneurs/i)).toBeInTheDocument();
  });

  it('renders range summary for multiple pages', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        showingFrom={11}
        showingTo={20}
        label="éléments"
      />
    );
    expect(screen.getByText(/Affichage 11-20 sur 50 éléments/i)).toBeInTheDocument();
  });

  it('previous button is disabled on first page', () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('next button is disabled on last page', () => {
    render(<Pagination currentPage={3} totalPages={3} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });

  it('calls onPageChange with previous page on prev click', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page on next click', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with specific page number when clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('current page button has primary class', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
    const pageBtn = screen.getByRole('button', { name: '2' });
    expect(pageBtn).toHaveClass('btn-primary');
  });

  it('non-active page buttons have outline class', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    const page3Btn = screen.getByRole('button', { name: '3' });
    expect(page3Btn).toHaveClass('btn-outline');
  });
});
