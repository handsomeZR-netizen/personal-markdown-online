/**
 * Unit tests for BottomNav component
 * Validates: Requirements 13.1, 13.2, 13.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from '../bottom-nav';

// Mock Next.js navigation hooks
const mockPush = vi.fn();
const mockPathname = '/notes';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon">Home</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  FolderOpen: () => <div data-testid="folder-icon">Folder</div>,
}));

describe('BottomNav', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Rendering', () => {
    it('renders all four navigation tabs', () => {
      render(<BottomNav />);

      // Check for all tab buttons
      expect(screen.getByLabelText('浏览笔记')).toBeInTheDocument();
      expect(screen.getByLabelText('搜索笔记')).toBeInTheDocument();
      expect(screen.getByLabelText('创建新笔记')).toBeInTheDocument();
      expect(screen.getByLabelText('查看文件夹')).toBeInTheDocument();
    });

    it('renders with correct icons', () => {
      render(<BottomNav />);

      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });

    it('has proper navigation role and aria-label', () => {
      render(<BottomNav />);

      const nav = screen.getByRole('navigation', { name: '底部导航' });
      expect(nav).toBeInTheDocument();
    });

    it('applies fixed positioning classes', () => {
      const { container } = render(<BottomNav />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    it('hides on large screens (lg:hidden)', () => {
      const { container } = render(<BottomNav />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('lg:hidden');
    });
  });

  describe('Tab Switching', () => {
    it('navigates to notes page when notes tab is clicked', () => {
      render(<BottomNav />);

      const notesButton = screen.getByLabelText('浏览笔记');
      fireEvent.click(notesButton);

      expect(mockPush).toHaveBeenCalledWith('/notes');
    });

    it('navigates to search when search tab is clicked', () => {
      render(<BottomNav />);

      const searchButton = screen.getByLabelText('搜索笔记');
      fireEvent.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith('/notes?search=true');
    });

    it('navigates to new note page when plus tab is clicked', () => {
      render(<BottomNav />);

      const newButton = screen.getByLabelText('创建新笔记');
      fireEvent.click(newButton);

      expect(mockPush).toHaveBeenCalledWith('/notes/new');
    });

    it('navigates to folders view when folders tab is clicked', () => {
      render(<BottomNav />);

      const foldersButton = screen.getByLabelText('查看文件夹');
      fireEvent.click(foldersButton);

      expect(mockPush).toHaveBeenCalledWith('/notes?view=folders');
    });
  });

  describe('Active State', () => {
    it('highlights notes tab when on notes page', () => {
      // The mockPathname is already set to '/notes' at the top
      render(<BottomNav />);

      const notesButton = screen.getByLabelText('浏览笔记');
      expect(notesButton).toHaveClass('text-primary');
      expect(notesButton).toHaveAttribute('aria-current', 'page');
    });

    it('highlights active tab with primary color', () => {
      render(<BottomNav />);

      const notesButton = screen.getByLabelText('浏览笔记');
      // Check if button has text-primary class (active state)
      expect(notesButton).toHaveClass('text-primary');
    });

    it('applies transition animations to tabs', () => {
      render(<BottomNav />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('transition-all', 'duration-200');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains minimum touch target size (44x44px)', () => {
      render(<BottomNav />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]');
      });
    });

    it('hides when hidden prop is true', () => {
      const { container } = render(<BottomNav hidden={true} />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('translate-y-full');
    });

    it('shows when hidden prop is false', () => {
      const { container } = render(<BottomNav hidden={false} />);
      const nav = container.querySelector('nav');

      expect(nav).not.toHaveClass('translate-y-full');
    });

    it('applies smooth transition animations', () => {
      const { container } = render(<BottomNav />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('transition-transform', 'duration-300', 'ease-in-out');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-labels for all tabs', () => {
      render(<BottomNav />);

      expect(screen.getByLabelText('浏览笔记')).toBeInTheDocument();
      expect(screen.getByLabelText('搜索笔记')).toBeInTheDocument();
      expect(screen.getByLabelText('创建新笔记')).toBeInTheDocument();
      expect(screen.getByLabelText('查看文件夹')).toBeInTheDocument();
    });

    it('renders icon and label for each tab', () => {
      render(<BottomNav />);

      // Each button should have both an icon (mocked) and a label
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
      
      // Check that icons are rendered (mocked components)
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });

    it('has focus ring on keyboard focus', () => {
      render(<BottomNav />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
      });
    });

    it('provides active:scale feedback on press', () => {
      render(<BottomNav />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('active:scale-95');
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<BottomNav className="custom-class" />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('custom-class');
    });

    it('maintains backdrop blur effect', () => {
      const { container } = render(<BottomNav />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('backdrop-blur-lg');
    });

    it('has border at top', () => {
      const { container } = render(<BottomNav />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('border-t', 'border-border');
    });
  });
});
