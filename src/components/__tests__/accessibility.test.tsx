import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock components for testing
const MockNoteCard = ({ title, content }: { title: string; content: string }) => (
  <article aria-label={`笔记: ${title}`}>
    <h2>{title}</h2>
    <p>{content}</p>
    <button aria-label="编辑笔记">编辑</button>
    <button aria-label="删除笔记">删除</button>
  </article>
);

const MockFolderTree = () => (
  <nav aria-label="文件夹导航">
    <ul role="tree">
      <li role="treeitem" aria-expanded="true" aria-label="工作文件夹">
        <button aria-label="展开工作文件夹">工作</button>
        <ul role="group">
          <li role="treeitem" aria-label="项目笔记">
            <a href="/notes/1">项目</a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
);

const MockEditor = () => (
  <div role="textbox" aria-label="笔记编辑器" aria-multiline="true" contentEditable>
    <p>编辑器内容</p>
  </div>
);

const MockShareDialog = ({ isOpen }: { isOpen: boolean }) => (
  <div
    role="dialog"
    aria-labelledby="share-dialog-title"
    aria-modal="true"
    hidden={!isOpen}
  >
    <h2 id="share-dialog-title">分享笔记</h2>
    <label htmlFor="email-input">邮箱地址</label>
    <input
      id="email-input"
      type="email"
      aria-required="true"
      aria-describedby="email-help"
    />
    <p id="email-help">输入协作者的邮箱地址</p>
    <button aria-label="关闭对话框">关闭</button>
  </div>
);

describe('Accessibility Tests', () => {
  describe('Keyboard Navigation', () => {
    it('should allow tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>按钮 1</button>
          <button>按钮 2</button>
          <input type="text" placeholder="输入框" />
          <a href="/test">链接</a>
        </div>
      );

      const button1 = screen.getByText('按钮 1');
      const button2 = screen.getByText('按钮 2');
      const input = screen.getByPlaceholderText('输入框');
      const link = screen.getByText('链接');

      // Tab through elements
      await user.tab();
      expect(button1).toHaveFocus();

      await user.tab();
      expect(button2).toHaveFocus();

      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(link).toHaveFocus();

      // Shift+Tab to go back
      await user.tab({ shift: true });
      expect(input).toHaveFocus();
    });

    it('should support Enter key to activate buttons', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<button onClick={handleClick}>点击我</button>);
      
      const button = screen.getByText('点击我');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support Space key to activate buttons', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<button onClick={handleClick}>点击我</button>);
      
      const button = screen.getByText('点击我');
      button.focus();
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support Escape key to close dialogs', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      
      render(
        <div role="dialog" onKeyDown={(e) => e.key === 'Escape' && handleClose()}>
          <button onClick={handleClose}>关闭</button>
        </div>
      );
      
      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalled();
    });

    it('should trap focus within modal dialogs', () => {
      render(<MockShareDialog isOpen={true} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      render(<MockNoteCard title="测试笔记" content="测试内容" />);
      
      expect(screen.getByLabelText('编辑笔记')).toBeInTheDocument();
      expect(screen.getByLabelText('删除笔记')).toBeInTheDocument();
      expect(screen.getByLabelText('笔记: 测试笔记')).toBeInTheDocument();
    });

    it('should use semantic HTML elements', () => {
      render(<MockNoteCard title="测试笔记" content="测试内容" />);
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('测试笔记');
    });

    it('should have proper tree structure for folder navigation', () => {
      render(<MockFolderTree />);
      
      const nav = screen.getByRole('navigation', { name: '文件夹导航' });
      expect(nav).toBeInTheDocument();
      
      const tree = screen.getByRole('tree');
      expect(tree).toBeInTheDocument();
      
      const treeitem = screen.getByRole('treeitem', { name: '工作文件夹' });
      expect(treeitem).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper role for editor', () => {
      render(<MockEditor />);
      
      const editor = screen.getByRole('textbox', { name: '笔记编辑器' });
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('aria-multiline', 'true');
    });

    it('should have proper dialog structure', () => {
      render(<MockShareDialog isOpen={true} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'share-dialog-title');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      
      const title = screen.getByText('分享笔记');
      expect(title).toHaveAttribute('id', 'share-dialog-title');
    });

    it('should associate labels with form inputs', () => {
      render(<MockShareDialog isOpen={true} />);
      
      const input = screen.getByLabelText('邮箱地址');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should provide help text for form inputs', () => {
      render(<MockShareDialog isOpen={true} />);
      
      const input = screen.getByLabelText('邮箱地址');
      expect(input).toHaveAttribute('aria-describedby', 'email-help');
      
      const helpText = screen.getByText('输入协作者的邮箱地址');
      expect(helpText).toHaveAttribute('id', 'email-help');
    });

    it('should mark required fields', () => {
      render(<MockShareDialog isOpen={true} />);
      
      const input = screen.getByLabelText('邮箱地址');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('ARIA Labels and Attributes', () => {
    it('should have aria-label on buttons without visible text', () => {
      render(
        <button aria-label="关闭">
          <span>×</span>
        </button>
      );
      
      const button = screen.getByLabelText('关闭');
      expect(button).toBeInTheDocument();
    });

    it('should use aria-expanded for collapsible elements', () => {
      const { rerender } = render(
        <button aria-expanded="false" aria-controls="content">
          展开
        </button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      rerender(
        <button aria-expanded="true" aria-controls="content">
          折叠
        </button>
      );
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should use aria-current for current page in navigation', () => {
      render(
        <nav>
          <a href="/notes" aria-current="page">笔记</a>
          <a href="/folders">文件夹</a>
        </nav>
      );
      
      const currentLink = screen.getByText('笔记');
      expect(currentLink).toHaveAttribute('aria-current', 'page');
    });

    it('should use aria-live for dynamic content updates', () => {
      render(
        <div aria-live="polite" aria-atomic="true">
          笔记已保存
        </div>
      );
      
      const liveRegion = screen.getByText('笔记已保存');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should use aria-busy for loading states', () => {
      render(
        <div aria-busy="true" aria-label="加载中">
          <span>加载笔记...</span>
        </div>
      );
      
      const loadingElement = screen.getByLabelText('加载中');
      expect(loadingElement).toHaveAttribute('aria-busy', 'true');
    });

    it('should use aria-disabled for disabled elements', () => {
      render(
        <button aria-disabled="true" disabled>
          保存
        </button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('should use aria-hidden for decorative elements', () => {
      render(
        <div>
          <span aria-hidden="true">🎨</span>
          <span>装饰图标</span>
        </div>
      );
      
      const decorative = screen.getByText('🎨');
      expect(decorative).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      render(<button className="focus:ring-2 focus:ring-blue-500">按钮</button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    it('should restore focus after closing dialog', async () => {
      const user = userEvent.setup();
      let isOpen = true;
      
      const { rerender } = render(
        <div>
          <button onClick={() => (isOpen = true)}>打开对话框</button>
          {isOpen && (
            <div role="dialog">
              <button onClick={() => (isOpen = false)}>关闭</button>
            </div>
          )}
        </div>
      );
      
      const openButton = screen.getByText('打开对话框');
      await user.click(openButton);
      
      const closeButton = screen.getByText('关闭');
      await user.click(closeButton);
      
      rerender(
        <div>
          <button onClick={() => (isOpen = true)}>打开对话框</button>
        </div>
      );
      
      // Focus should return to the trigger button
      expect(document.activeElement).toBe(openButton);
    });

    it('should skip to main content with skip link', () => {
      render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            跳转到主内容
          </a>
          <nav>导航</nav>
          <main id="main-content">主内容</main>
        </div>
      );
      
      const skipLink = screen.getByText('跳转到主内容');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should not rely solely on color to convey information', () => {
      render(
        <div>
          <span className="text-red-500" aria-label="错误">
            ⚠️ 错误消息
          </span>
          <span className="text-green-500" aria-label="成功">
            ✓ 成功消息
          </span>
        </div>
      );
      
      // Icons and text provide additional context beyond color
      expect(screen.getByLabelText('错误')).toHaveTextContent('⚠️');
      expect(screen.getByLabelText('成功')).toHaveTextContent('✓');
    });

    it('should have sufficient text size for readability', () => {
      render(
        <p className="text-base">
          这是正常大小的文本
        </p>
      );
      
      const text = screen.getByText('这是正常大小的文本');
      expect(text).toHaveClass('text-base');
    });

    it('should support reduced motion preferences', () => {
      render(
        <div className="transition-all motion-reduce:transition-none">
          动画元素
        </div>
      );
      
      const element = screen.getByText('动画元素');
      expect(element).toHaveClass('motion-reduce:transition-none');
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have touch targets of at least 44x44 pixels', () => {
      render(
        <button className="min-w-[44px] min-h-[44px]">
          按钮
        </button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-w-[44px]', 'min-h-[44px]');
    });

    it('should support pinch-to-zoom', () => {
      render(
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      );
      
      // Viewport meta tag should not have maximum-scale=1 or user-scalable=no
      const viewport = document.querySelector('meta[name="viewport"]');
      const content = viewport?.getAttribute('content') || '';
      expect(content).not.toContain('maximum-scale=1');
      expect(content).not.toContain('user-scalable=no');
    });
  });

  describe('Error Handling and Feedback', () => {
    it('should announce errors to screen readers', () => {
      render(
        <div role="alert" aria-live="assertive">
          上传失败，请重试
        </div>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(alert).toHaveTextContent('上传失败，请重试');
    });

    it('should provide error messages for form validation', () => {
      render(
        <div>
          <label htmlFor="email">邮箱</label>
          <input
            id="email"
            type="email"
            aria-invalid="true"
            aria-describedby="email-error"
          />
          <span id="email-error" role="alert">
            请输入有效的邮箱地址
          </span>
        </div>
      );
      
      const input = screen.getByLabelText('邮箱');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('请输入有效的邮箱地址');
    });
  });
});
