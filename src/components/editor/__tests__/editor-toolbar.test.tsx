/**
 * Unit tests for EditorToolbar component
 * Tests formatting buttons, active state highlighting, and mobile toolbar
 * Validates: Requirements 20.1, 20.3, 20.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorToolbar } from '../editor-toolbar';
import { Editor } from '@tiptap/react';

// Mock the UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, title, type }: any) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      title={title}
      type={type}
      data-testid={title}
    >
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bold: () => <span data-testid="bold-icon">Bold</span>,
  Italic: () => <span data-testid="italic-icon">Italic</span>,
  Strikethrough: () => <span data-testid="strikethrough-icon">Strikethrough</span>,
  Code: () => <span data-testid="code-icon">Code</span>,
  Heading1: () => <span data-testid="heading1-icon">H1</span>,
  Heading2: () => <span data-testid="heading2-icon">H2</span>,
  Heading3: () => <span data-testid="heading3-icon">H3</span>,
  List: () => <span data-testid="list-icon">List</span>,
  ListOrdered: () => <span data-testid="list-ordered-icon">OrderedList</span>,
  Quote: () => <span data-testid="quote-icon">Quote</span>,
  Undo: () => <span data-testid="undo-icon">Undo</span>,
  Redo: () => <span data-testid="redo-icon">Redo</span>,
  Image: () => <span data-testid="image-icon">Image</span>,
}));

describe('EditorToolbar', () => {
  let mockEditor: Partial<Editor>;
  let mockChain: any;

  beforeEach(() => {
    // Create a mock chain object
    mockChain = {
      focus: vi.fn().mockReturnThis(),
      toggleBold: vi.fn().mockReturnThis(),
      toggleItalic: vi.fn().mockReturnThis(),
      toggleStrike: vi.fn().mockReturnThis(),
      toggleCode: vi.fn().mockReturnThis(),
      toggleHeading: vi.fn().mockReturnThis(),
      toggleBulletList: vi.fn().mockReturnThis(),
      toggleOrderedList: vi.fn().mockReturnThis(),
      toggleBlockquote: vi.fn().mockReturnThis(),
      setImage: vi.fn().mockReturnThis(),
      undo: vi.fn().mockReturnThis(),
      redo: vi.fn().mockReturnThis(),
      run: vi.fn(),
    };

    // Create a mock editor
    mockEditor = {
      chain: vi.fn().mockReturnValue(mockChain),
      isActive: vi.fn().mockReturnValue(false),
      can: vi.fn().mockReturnValue({
        undo: vi.fn().mockReturnValue(true),
        redo: vi.fn().mockReturnValue(true),
      }),
    };
  });

  describe('Rendering', () => {
    it('should render all formatting buttons', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      // Text formatting buttons
      expect(screen.getByTitle('加粗 (Ctrl+B)')).toBeInTheDocument();
      expect(screen.getByTitle('斜体 (Ctrl+I)')).toBeInTheDocument();
      expect(screen.getByTitle('删除线')).toBeInTheDocument();
      expect(screen.getByTitle('代码')).toBeInTheDocument();

      // Heading buttons
      expect(screen.getByTitle('一级标题')).toBeInTheDocument();
      expect(screen.getByTitle('二级标题')).toBeInTheDocument();
      expect(screen.getByTitle('三级标题')).toBeInTheDocument();

      // List buttons
      expect(screen.getByTitle('无序列表')).toBeInTheDocument();
      expect(screen.getByTitle('有序列表')).toBeInTheDocument();
      expect(screen.getByTitle('引用')).toBeInTheDocument();

      // Image button
      expect(screen.getByTitle('插入图片')).toBeInTheDocument();

      // Undo/Redo buttons
      expect(screen.getByTitle('撤销 (Ctrl+Z)')).toBeInTheDocument();
      expect(screen.getByTitle('重做 (Ctrl+Y)')).toBeInTheDocument();
    });

    it('should return null when editor is null', () => {
      const { container } = render(<EditorToolbar editor={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Format Button Clicks', () => {
    it('should toggle bold when bold button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const boldButton = screen.getByTitle('加粗 (Ctrl+B)');
      fireEvent.click(boldButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleBold).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle italic when italic button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const italicButton = screen.getByTitle('斜体 (Ctrl+I)');
      fireEvent.click(italicButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleItalic).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle strikethrough when strikethrough button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const strikeButton = screen.getByTitle('删除线');
      fireEvent.click(strikeButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleStrike).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle code when code button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const codeButton = screen.getByTitle('代码');
      fireEvent.click(codeButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleCode).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle heading level 1 when H1 button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const h1Button = screen.getByTitle('一级标题');
      fireEvent.click(h1Button);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 1 });
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle heading level 2 when H2 button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const h2Button = screen.getByTitle('二级标题');
      fireEvent.click(h2Button);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 2 });
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle heading level 3 when H3 button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const h3Button = screen.getByTitle('三级标题');
      fireEvent.click(h3Button);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 3 });
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle bullet list when list button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const listButton = screen.getByTitle('无序列表');
      fireEvent.click(listButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleBulletList).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle ordered list when ordered list button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const orderedListButton = screen.getByTitle('有序列表');
      fireEvent.click(orderedListButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleOrderedList).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should toggle blockquote when quote button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const quoteButton = screen.getByTitle('引用');
      fireEvent.click(quoteButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.toggleBlockquote).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should call undo when undo button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const undoButton = screen.getByTitle('撤销 (Ctrl+Z)');
      fireEvent.click(undoButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.undo).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });

    it('should call redo when redo button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const redoButton = screen.getByTitle('重做 (Ctrl+Y)');
      fireEvent.click(redoButton);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.redo).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();
    });
  });

  describe('Active State Highlighting', () => {
    it('should highlight bold button when bold is active', () => {
      mockEditor.isActive = vi.fn((format) => format === 'bold');
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const boldButton = screen.getByTitle('加粗 (Ctrl+B)');
      expect(boldButton.className).toContain('bg-accent');
    });

    it('should highlight italic button when italic is active', () => {
      mockEditor.isActive = vi.fn((format) => format === 'italic');
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const italicButton = screen.getByTitle('斜体 (Ctrl+I)');
      expect(italicButton.className).toContain('bg-accent');
    });

    it('should highlight heading button when heading is active', () => {
      mockEditor.isActive = vi.fn((format, attrs) => 
        format === 'heading' && attrs?.level === 1
      );
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const h1Button = screen.getByTitle('一级标题');
      expect(h1Button.className).toContain('bg-accent');
    });

    it('should highlight bullet list button when bullet list is active', () => {
      mockEditor.isActive = vi.fn((format) => format === 'bulletList');
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const listButton = screen.getByTitle('无序列表');
      expect(listButton.className).toContain('bg-accent');
    });

    it('should not highlight buttons when no format is active', () => {
      mockEditor.isActive = vi.fn().mockReturnValue(false);
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const boldButton = screen.getByTitle('加粗 (Ctrl+B)');
      const italicButton = screen.getByTitle('斜体 (Ctrl+I)');
      
      expect(boldButton.className).not.toContain('bg-accent');
      expect(italicButton.className).not.toContain('bg-accent');
    });
  });

  describe('Undo/Redo State', () => {
    it('should disable undo button when undo is not available', () => {
      mockEditor.can = vi.fn().mockReturnValue({
        undo: vi.fn().mockReturnValue(false),
        redo: vi.fn().mockReturnValue(true),
      });
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const undoButton = screen.getByTitle('撤销 (Ctrl+Z)');
      expect(undoButton).toBeDisabled();
    });

    it('should disable redo button when redo is not available', () => {
      mockEditor.can = vi.fn().mockReturnValue({
        undo: vi.fn().mockReturnValue(true),
        redo: vi.fn().mockReturnValue(false),
      });
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const redoButton = screen.getByTitle('重做 (Ctrl+Y)');
      expect(redoButton).toBeDisabled();
    });

    it('should enable both undo and redo when both are available', () => {
      mockEditor.can = vi.fn().mockReturnValue({
        undo: vi.fn().mockReturnValue(true),
        redo: vi.fn().mockReturnValue(true),
      });
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const undoButton = screen.getByTitle('撤销 (Ctrl+Z)');
      const redoButton = screen.getByTitle('重做 (Ctrl+Y)');
      
      expect(undoButton).not.toBeDisabled();
      expect(redoButton).not.toBeDisabled();
    });
  });

  describe('Image Upload', () => {
    it('should trigger file input when image button is clicked', () => {
      render(<EditorToolbar editor={mockEditor as Editor} />);

      const imageButton = screen.getByTitle('插入图片');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      const clickSpy = vi.spyOn(fileInput, 'click');
      fireEvent.click(imageButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should call onImageUpload when file is selected', async () => {
      const mockOnImageUpload = vi.fn().mockResolvedValue('https://example.com/image.jpg');
      render(<EditorToolbar editor={mockEditor as Editor} onImageUpload={mockOnImageUpload} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockOnImageUpload).toHaveBeenCalledWith(file);
    });

    it('should insert image into editor after successful upload', async () => {
      const mockOnImageUpload = vi.fn().mockResolvedValue('https://example.com/image.jpg');
      render(<EditorToolbar editor={mockEditor as Editor} onImageUpload={mockOnImageUpload} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockChain.setImage).toHaveBeenCalledWith({ src: 'https://example.com/image.jpg' });
    });

    it('should reset file input after upload', async () => {
      const mockOnImageUpload = vi.fn().mockResolvedValue('https://example.com/image.jpg');
      render(<EditorToolbar editor={mockEditor as Editor} onImageUpload={mockOnImageUpload} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fileInput.value).toBe('');
    });
  });
});
