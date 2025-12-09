/**
 * Unit tests for Breadcrumbs component
 * Validates: Requirements 5.1
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs, type BreadcrumbItem } from '../breadcrumbs';

describe('Breadcrumbs', () => {
  const mockItems: BreadcrumbItem[] = [
    { id: '1', name: 'Work', href: '/folders/1' },
    { id: '2', name: 'Projects', href: '/folders/2' },
    { id: '3', name: 'Documentation', href: '/folders/3' },
  ];

  it('renders breadcrumb path with home', () => {
    render(<Breadcrumbs items={mockItems} />);

    // Home should always be present
    expect(screen.getByRole('link', { name: /首页/i })).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('displays last item as non-clickable', () => {
    render(<Breadcrumbs items={mockItems} />);

    const lastItem = screen.getByText('Documentation');
    expect(lastItem.tagName).not.toBe('A');
    expect(lastItem).toHaveClass('font-medium');
  });

  it('makes intermediate items clickable', () => {
    render(<Breadcrumbs items={mockItems} />);

    const workLink = screen.getByRole('link', { name: 'Work' });
    expect(workLink).toHaveAttribute('href', '/folders/1');

    const projectsLink = screen.getByRole('link', { name: 'Projects' });
    expect(projectsLink).toHaveAttribute('href', '/folders/2');
  });

  it('handles long paths with ellipsis', () => {
    const longPath: BreadcrumbItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      name: `Folder ${i}`,
      href: `/folders/${i}`,
    }));

    render(<Breadcrumbs items={longPath} maxItems={5} />);

    // Should show ellipsis
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('shows full path tooltip on ellipsis hover', () => {
    const longPath: BreadcrumbItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      name: `Folder ${i}`,
      href: `/folders/${i}`,
    }));

    render(<Breadcrumbs items={longPath} maxItems={5} />);

    const ellipsis = screen.getByText('...');
    expect(ellipsis).toHaveAttribute('title');
  });

  it('handles empty path (only home)', () => {
    render(<Breadcrumbs items={[]} />);

    expect(screen.getByRole('link', { name: /首页/i })).toBeInTheDocument();
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('renders chevron separators between items', () => {
    const { container } = render(<Breadcrumbs items={mockItems} />);

    // Should have chevrons between items (home + 3 items = 3 chevrons)
    const chevrons = container.querySelectorAll('svg');
    expect(chevrons.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <Breadcrumbs items={mockItems} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
