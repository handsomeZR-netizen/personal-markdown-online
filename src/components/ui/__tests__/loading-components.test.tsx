import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 创意加载器测试
import { CreativeLoader, LoadingOverlay, ButtonLoader } from '../creative-loader';

// 点击加载器测试
import { 
  ClickLoader, 
  ClickLoadingProvider, 
  useClickLoading,
  ClickableWithLoader 
} from '../click-loader';

// 交互式加载器测试
import {
  InteractiveLoader,
  CardLoader,
  ListItemLoader,
  ButtonLoaderWrapper,
  IconButtonLoader,
} from '../interactive-loader';

// 加载按钮测试
import { LoadingButton, AsyncButton } from '../loading-button';

// 加载容器测试
import { LoadingContainer, InlineLoader } from '../with-loading';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, className, onClick, animate, ...props }: any) => (
        <div className={className} onClick={onClick} {...props}>{children}</div>
      ),
      span: ({ children, className, ...props }: any) => (
        <span className={className} {...props}>{children}</span>
      ),
      p: ({ children, className, ...props }: any) => (
        <p className={className} {...props}>{children}</p>
      ),
      button: ({ children, className, onClick, disabled, ...props }: any) => (
        <button className={className} onClick={onClick} disabled={disabled} {...props}>{children}</button>
      ),
    },
  };
});

describe('CreativeLoader', () => {
  it('renders with default props', () => {
    render(<CreativeLoader />);
    // 组件应该渲染
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const variants = ['dots', 'pulse', 'orbit', 'wave', 'bounce', 'flip'] as const;
    
    variants.forEach(variant => {
      const { unmount } = render(<CreativeLoader variant={variant} />);
      expect(document.querySelector('.flex')).toBeInTheDocument();
      unmount();
    });
  });

  it('renders with different sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(<CreativeLoader size={size} />);
      expect(document.querySelector('.flex')).toBeInTheDocument();
      unmount();
    });
  });

  it('renders with message', () => {
    render(<CreativeLoader message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CreativeLoader className="custom-class" />);
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });
});

describe('LoadingOverlay', () => {
  it('renders overlay with default props', () => {
    render(<LoadingOverlay />);
    expect(document.querySelector('.fixed')).toBeInTheDocument();
  });

  it('renders with message', () => {
    render(<LoadingOverlay message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders with blur effect', () => {
    render(<LoadingOverlay blur={true} />);
    expect(document.querySelector('.backdrop-blur-sm')).toBeInTheDocument();
  });

  it('renders without blur effect', () => {
    render(<LoadingOverlay blur={false} />);
    expect(document.querySelector('.backdrop-blur-sm')).not.toBeInTheDocument();
  });
});

describe('ButtonLoader', () => {
  it('renders with default props', () => {
    render(<ButtonLoader />);
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const variants = ['dots', 'pulse', 'orbit'] as const;
    
    variants.forEach(variant => {
      const { unmount } = render(<ButtonLoader variant={variant} />);
      expect(document.querySelector('.flex')).toBeInTheDocument();
      unmount();
    });
  });
});

describe('ClickLoader', () => {
  it('renders with default props', () => {
    render(<ClickLoader />);
    expect(document.querySelector('.inline-flex')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const variants = ['ripple', 'pulse', 'spinner', 'dots', 'progress', 'bounce', 'morph', 'glow'] as const;
    
    variants.forEach(variant => {
      const { unmount } = render(<ClickLoader variant={variant} />);
      expect(document.querySelector('.inline-flex')).toBeInTheDocument();
      unmount();
    });
  });

  it('renders with different sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(<ClickLoader size={size} />);
      expect(document.querySelector('.inline-flex')).toBeInTheDocument();
      unmount();
    });
  });

  it('applies custom color', () => {
    render(<ClickLoader color="#ff0000" />);
    expect(document.querySelector('.inline-flex')).toBeInTheDocument();
  });
});

describe('ClickLoadingProvider and useClickLoading', () => {
  function TestComponent() {
    const { isLoading, setLoading, withClickLoading } = useClickLoading();
    
    return (
      <div>
        <span data-testid="loading-status">{isLoading('test') ? 'loading' : 'idle'}</span>
        <button onClick={() => setLoading('test', true)}>Start Loading</button>
        <button onClick={() => setLoading('test', false)}>Stop Loading</button>
        <button onClick={() => withClickLoading('async-test', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        })}>
          Async Action
        </button>
      </div>
    );
  }

  it('provides loading context', () => {
    render(
      <ClickLoadingProvider>
        <TestComponent />
      </ClickLoadingProvider>
    );
    
    expect(screen.getByTestId('loading-status')).toHaveTextContent('idle');
  });

  it('can set loading state', async () => {
    render(
      <ClickLoadingProvider>
        <TestComponent />
      </ClickLoadingProvider>
    );
    
    fireEvent.click(screen.getByText('Start Loading'));
    expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
    
    fireEvent.click(screen.getByText('Stop Loading'));
    expect(screen.getByTestId('loading-status')).toHaveTextContent('idle');
  });

  it('throws error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useClickLoading must be used within ClickLoadingProvider');
    
    consoleError.mockRestore();
  });
});

describe('LoadingButton', () => {
  it('renders with default props', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<LoadingButton loading={true}>Click me</LoadingButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<LoadingButton loading={true}>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when loading', () => {
    const handleClick = vi.fn();
    render(<LoadingButton loading={true} onClick={handleClick}>Click me</LoadingButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('AsyncButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with default props', () => {
    render(<AsyncButton>Async Action</AsyncButton>);
    expect(screen.getByText('Async Action')).toBeInTheDocument();
  });

  it('handles async click and shows loading', async () => {
    vi.useRealTimers(); // 使用真实计时器
    const onClick = vi.fn().mockImplementation(() => Promise.resolve());
    const onSuccess = vi.fn();
    
    render(
      <AsyncButton onClick={onClick} onSuccess={onSuccess}>
        Async Action
      </AsyncButton>
    );
    
    fireEvent.click(screen.getByText('Async Action'));
    expect(onClick).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('handles errors', async () => {
    vi.useRealTimers(); // 使用真实计时器
    const onClick = vi.fn().mockRejectedValue(new Error('Test error'));
    const onError = vi.fn();
    
    render(
      <AsyncButton onClick={onClick} onError={onError}>
        Async Action
      </AsyncButton>
    );
    
    fireEvent.click(screen.getByText('Async Action'));
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});

describe('LoadingContainer', () => {
  it('renders children when not loading', () => {
    render(
      <LoadingContainer isLoading={false}>
        <div>Content</div>
      </LoadingContainer>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows loader when loading', () => {
    render(
      <LoadingContainer isLoading={true} message="Loading...">
        <div>Content</div>
      </LoadingContainer>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows overlay when loading with overlay prop', () => {
    render(
      <LoadingContainer isLoading={true} overlay={true}>
        <div>Content</div>
      </LoadingContainer>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(document.querySelector('.absolute')).toBeInTheDocument();
  });
});

describe('InlineLoader', () => {
  it('renders with default props', () => {
    render(<InlineLoader />);
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  it('renders with message', () => {
    render(<InlineLoader message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const variants = ['dots', 'pulse', 'orbit'] as const;
    
    variants.forEach(variant => {
      const { unmount } = render(<InlineLoader variant={variant} />);
      expect(document.querySelector('.flex')).toBeInTheDocument();
      unmount();
    });
  });
});

describe('CardLoader', () => {
  it('renders children', () => {
    render(
      <CardLoader>
        <div>Card Content</div>
      </CardLoader>
    );
    
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('shows loading overlay when loading', () => {
    render(
      <CardLoader isLoading={true} loadingMessage="Loading card...">
        <div>Card Content</div>
      </CardLoader>
    );
    
    expect(screen.getByText('Loading card...')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(
      <CardLoader onClick={handleClick}>
        <div>Card Content</div>
      </CardLoader>
    );
    
    fireEvent.click(screen.getByText('Card Content'));
    expect(handleClick).toHaveBeenCalled();
  });
});

describe('ListItemLoader', () => {
  it('renders children', () => {
    render(
      <ListItemLoader>
        <div>List Item</div>
      </ListItemLoader>
    );
    
    expect(screen.getByText('List Item')).toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    render(
      <ListItemLoader isLoading={true}>
        <div>List Item</div>
      </ListItemLoader>
    );
    
    expect(screen.getByText('List Item')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(
      <ListItemLoader onClick={handleClick}>
        <div>List Item</div>
      </ListItemLoader>
    );
    
    fireEvent.click(screen.getByText('List Item'));
    expect(handleClick).toHaveBeenCalled();
  });
});

describe('ButtonLoaderWrapper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(<ButtonLoaderWrapper>Button Text</ButtonLoaderWrapper>);
    expect(screen.getByText('Button Text')).toBeInTheDocument();
  });

  it('handles async click', async () => {
    const onClick = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));
    
    render(<ButtonLoaderWrapper onClick={onClick}>Click Me</ButtonLoaderWrapper>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when loading', () => {
    render(<ButtonLoaderWrapper isLoading={true}>Click Me</ButtonLoaderWrapper>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('IconButtonLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders icon', () => {
    render(<IconButtonLoader icon={<span>Icon</span>} />);
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('handles async click', async () => {
    const onClick = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));
    
    render(<IconButtonLoader icon={<span>Icon</span>} onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows loading icon when loading', () => {
    render(
      <IconButtonLoader 
        icon={<span>Icon</span>} 
        loadingIcon={<span>Loading Icon</span>}
        isLoading={true} 
      />
    );
    expect(screen.getByText('Loading Icon')).toBeInTheDocument();
  });
});

describe('InteractiveLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <InteractiveLoader>
        <div>Interactive Content</div>
      </InteractiveLoader>
    );
    
    expect(screen.getByText('Interactive Content')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));
    
    render(
      <InteractiveLoader onClick={onClick}>
        <div>Click Me</div>
      </InteractiveLoader>
    );
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    
    render(
      <InteractiveLoader onClick={onClick} disabled={true}>
        <div>Disabled</div>
      </InteractiveLoader>
    );
    
    fireEvent.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
