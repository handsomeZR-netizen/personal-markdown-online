import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWA, useServiceWorker } from '../use-pwa';

describe('usePWA', () => {
  beforeEach(() => {
    // Reset DOM and mocks
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(typeof result.current.installPWA).toBe('function');
  });

  it('should detect if app is already installed', () => {
    // Mock display-mode: standalone
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstalled).toBe(true);
  });

  it('should handle beforeinstallprompt event', async () => {
    const { result } = renderHook(() => usePWA());

    const mockPrompt = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    const event = new Event('beforeinstallprompt');
    Object.assign(event, mockPrompt);

    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
  });

  it('should handle app installation', async () => {
    const { result } = renderHook(() => usePWA());

    const mockPrompt = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    const event = new Event('beforeinstallprompt');
    Object.assign(event, mockPrompt);

    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });

    let installResult: boolean | undefined;
    await act(async () => {
      installResult = await result.current.installPWA();
    });

    expect(installResult).toBe(true);
    expect(mockPrompt.prompt).toHaveBeenCalled();
  });

  it('should handle installation rejection', async () => {
    const { result } = renderHook(() => usePWA());

    const mockPrompt = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    };

    const event = new Event('beforeinstallprompt');
    Object.assign(event, mockPrompt);

    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });

    let installResult: boolean | undefined;
    await act(async () => {
      installResult = await result.current.installPWA();
    });

    expect(installResult).toBe(false);
  });

  it('should handle appinstalled event', async () => {
    const { result } = renderHook(() => usePWA());

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    await waitFor(() => {
      expect(result.current.isInstalled).toBe(true);
      expect(result.current.isInstallable).toBe(false);
    });
  });
});

describe('useServiceWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default: service worker not supported
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  it('should detect service worker support', () => {
    // Mock service worker support
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve({
          active: {},
          installing: null,
          waiting: null,
          update: vi.fn(),
          unregister: vi.fn(),
        }),
      },
    });

    const { result } = renderHook(() => useServiceWorker());

    expect(result.current.isSupported).toBe(true);
  });

  it('should detect when service worker is not supported', () => {
    // Service worker is already undefined from beforeEach
    const { result } = renderHook(() => useServiceWorker());

    expect(result.current.isSupported).toBe(false);
  });

  it('should register service worker when ready', async () => {
    const mockRegistration = {
      active: {},
      installing: null,
      waiting: null,
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(true),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration),
      },
    });

    const { result } = renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
      expect(result.current.registration).toBeTruthy();
    });
  });

  it('should update service worker', async () => {
    const mockRegistration = {
      active: {},
      installing: null,
      waiting: null,
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(true),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration),
      },
    });

    const { result } = renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    await act(async () => {
      await result.current.updateServiceWorker();
    });

    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('should unregister service worker', async () => {
    const mockRegistration = {
      active: {},
      installing: null,
      waiting: null,
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(true),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration),
      },
    });

    const { result } = renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    let unregisterResult: boolean | undefined;
    await act(async () => {
      unregisterResult = await result.current.unregisterServiceWorker();
    });

    expect(unregisterResult).toBe(true);
    expect(mockRegistration.unregister).toHaveBeenCalled();
  });
});
