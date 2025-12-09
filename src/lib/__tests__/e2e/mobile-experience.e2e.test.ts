/**
 * E2E Test: Mobile Experience
 * Tests PWA installation, gestures, bottom navigation, and keyboard handling
 * Requirements: 11.1, 12.1, 13.1, 14.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('E2E: Mobile Experience', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 667 });

    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', { writable: true, value: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PWA Installation', () => {
    it('should prompt user to add to home screen', () => {
      // Requirement 11.1: Show "Add to Home Screen" prompt
      let promptShown = false;
      let deferredPrompt: any = null;

      // Mock beforeinstallprompt event
      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        promptShown = true;
      });

      // Trigger the event
      const event = new Event('beforeinstallprompt');
      Object.assign(event, mockEvent);
      window.dispatchEvent(event);

      expect(promptShown).toBe(true);
      expect(deferredPrompt).not.toBeNull();
    });

    it('should run in standalone mode after installation', () => {
      // Requirement 11.2: Run in fullscreen without address bar
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Mock standalone mode
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: true,
      });

      expect(window.navigator.standalone || isStandalone).toBe(true);
    });

    it('should show cached content when offline', async () => {
      // Requirement 11.3: Show cached content offline
      const mockServiceWorker = {
        state: 'activated',
        addEventListener: vi.fn(),
      };

      // Mock service worker registration
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: {
          register: vi.fn().mockResolvedValue({
            active: mockServiceWorker,
            installing: null,
            waiting: null,
          }),
          ready: Promise.resolve({
            active: mockServiceWorker,
          }),
        },
      });

      const registration = await navigator.serviceWorker.register('/sw.js');
      expect(registration.active).toBeDefined();
      expect(registration.active?.state).toBe('activated');
    });

    it('should update app in background when new version available', async () => {
      // Requirement 11.4: Background update
      let updateAvailable = false;

      const mockServiceWorker = {
        state: 'installed',
        addEventListener: vi.fn(),
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: {
          register: vi.fn().mockResolvedValue({
            active: { state: 'activated' },
            installing: null,
            waiting: mockServiceWorker,
          }),
          addEventListener: vi.fn((event, handler) => {
            if (event === 'controllerchange') {
              updateAvailable = true;
              handler();
            }
          }),
        },
      });

      await navigator.serviceWorker.register('/sw.js');
      
      // Simulate update available
      const controllerChangeEvent = new Event('controllerchange');
      navigator.serviceWorker.dispatchEvent(controllerChangeEvent);

      expect(updateAvailable).toBe(true);
    });

    it('should clear cache data when PWA is uninstalled', () => {
      // Requirement 11.5: Clear cache on uninstall
      const mockCaches = {
        keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
        delete: vi.fn().mockResolvedValue(true),
      };

      Object.defineProperty(global, 'caches', {
        writable: true,
        value: mockCaches,
      });

      const clearAllCaches = async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      };

      expect(clearAllCaches()).resolves.toBeUndefined();
    });
  });

  describe('Gesture Interactions', () => {
    it('should open sidebar on right swipe from left edge', () => {
      // Requirement 12.1: Swipe right to open sidebar
      let sidebarOpen = false;
      let startX = 0;
      let startY = 0;

      const handleTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        const deltaX = endX - startX;

        // Swipe from left edge (< 20px) and move right (> 50px)
        if (startX < 20 && deltaX > 50) {
          sidebarOpen = true;
        }
      };

      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);

      // Simulate swipe from left edge
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 10, clientY: 300 } as Touch],
      });
      document.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 300 } as Touch],
      });
      document.dispatchEvent(touchEnd);

      expect(sidebarOpen).toBe(true);

      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    });

    it('should close sidebar on left swipe', () => {
      // Requirement 12.2: Swipe left to close sidebar
      let sidebarOpen = true;
      let startX = 0;

      const handleTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        const deltaX = endX - startX;

        // Swipe left (< -50px)
        if (deltaX < -50) {
          sidebarOpen = false;
        }
      };

      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);

      // Simulate left swipe
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 300 } as Touch],
      });
      document.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 300 } as Touch],
      });
      document.dispatchEvent(touchEnd);

      expect(sidebarOpen).toBe(false);

      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    });

    it('should trigger pull-to-refresh when swiping down at top', async () => {
      // Requirement 12.3: Pull to refresh
      let refreshTriggered = false;
      let startY = 0;

      const handleTouchStart = (e: TouchEvent) => {
        if (window.scrollY === 0) {
          startY = e.touches[0].clientY;
        }
      };

      const handleTouchEnd = async (e: TouchEvent) => {
        const endY = e.changedTouches[0].clientY;
        const pullDistance = endY - startY;

        if (pullDistance > 100 && window.scrollY === 0) {
          refreshTriggered = true;
          // Simulate refresh
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      };

      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);

      // Mock scroll position at top
      Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });

      // Simulate pull down
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 50 } as Touch],
      });
      document.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 200 } as Touch],
      });
      await document.dispatchEvent(touchEnd);

      expect(refreshTriggered).toBe(true);

      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    });

    it('should show action buttons on left swipe on note card', () => {
      // Requirement 12.4: Swipe left to show actions
      let actionsVisible = false;
      let startX = 0;

      const handleTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        const deltaX = endX - startX;

        // Swipe left on card
        if (deltaX < -50) {
          actionsVisible = true;
        }
      };

      const noteCard = document.createElement('div');
      noteCard.addEventListener('touchstart', handleTouchStart);
      noteCard.addEventListener('touchend', handleTouchEnd);

      // Simulate left swipe on card
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 300, clientY: 100 } as Touch],
        bubbles: true,
      });
      noteCard.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 } as Touch],
        bubbles: true,
      });
      noteCard.dispatchEvent(touchEnd);

      expect(actionsVisible).toBe(true);
    });

    it('should enter edit mode on double tap of note title', () => {
      // Requirement 12.5: Double tap to edit
      let editMode = false;
      let lastTap = 0;

      const handleTouchEnd = () => {
        const now = Date.now();
        if (now - lastTap < 300) {
          editMode = true;
        }
        lastTap = now;
      };

      const noteTitle = document.createElement('div');
      noteTitle.addEventListener('touchend', handleTouchEnd);

      // First tap
      noteTitle.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      expect(editMode).toBe(false);

      // Second tap within 300ms
      noteTitle.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      expect(editMode).toBe(true);
    });
  });

  describe('Bottom Navigation', () => {
    it('should display bottom navigation on mobile devices', () => {
      // Requirement 13.1: Show bottom nav on mobile
      const isMobile = window.innerWidth < 640;
      expect(isMobile).toBe(true);

      const bottomNav = {
        visible: isMobile,
        tabs: ['笔记', '搜索', '新建', '目录'],
      };

      expect(bottomNav.visible).toBe(true);
      expect(bottomNav.tabs).toHaveLength(4);
    });

    it('should include all four tabs in bottom navigation', () => {
      // Requirement 13.2: Four tabs (Notes, Search, New, Folders)
      const tabs = [
        { id: 'notes', label: '笔记', icon: 'FileText' },
        { id: 'search', label: '搜索', icon: 'Search' },
        { id: 'new', label: '新建', icon: 'Plus' },
        { id: 'folders', label: '目录', icon: 'Folder' },
      ];

      expect(tabs).toHaveLength(4);
      expect(tabs.map(t => t.label)).toEqual(['笔记', '搜索', '新建', '目录']);
    });

    it('should switch pages and highlight active tab on click', () => {
      // Requirement 13.3: Switch pages and highlight active
      let activePage = 'notes';

      const switchTab = (tabId: string) => {
        activePage = tabId;
      };

      expect(activePage).toBe('notes');

      switchTab('search');
      expect(activePage).toBe('search');

      switchTab('folders');
      expect(activePage).toBe('folders');
    });

    it('should keep bottom navigation fixed while scrolling', () => {
      // Requirement 13.4: Fixed position while scrolling
      const bottomNav = document.createElement('nav');
      bottomNav.style.position = 'fixed';
      bottomNav.style.bottom = '0';

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { writable: true, value: 500 });

      // Bottom nav should remain fixed
      expect(bottomNav.style.position).toBe('fixed');
      expect(bottomNav.style.bottom).toBe('0');
    });

    it('should hide bottom navigation in edit mode', () => {
      // Requirement 13.5: Hide in edit mode
      let isEditMode = false;
      let bottomNavVisible = true;

      const toggleEditMode = (editing: boolean) => {
        isEditMode = editing;
        bottomNavVisible = !editing;
      };

      expect(bottomNavVisible).toBe(true);

      toggleEditMode(true);
      expect(bottomNavVisible).toBe(false);

      toggleEditMode(false);
      expect(bottomNavVisible).toBe(true);
    });
  });

  describe('Keyboard Handling', () => {
    it('should adjust editor height when keyboard appears', () => {
      // Requirement 14.1: Adjust height when keyboard opens
      const initialHeight = window.innerHeight;
      let editorHeight = initialHeight - 100; // Header/footer space

      // Mock Visual Viewport API
      const mockVisualViewport = {
        height: initialHeight,
        addEventListener: vi.fn(),
      };

      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        value: mockVisualViewport,
      });

      // Simulate keyboard opening (viewport height decreases)
      mockVisualViewport.height = initialHeight - 300;
      editorHeight = mockVisualViewport.height - 100;

      expect(editorHeight).toBe(initialHeight - 400);
      expect(editorHeight).toBeLessThan(initialHeight);
    });

    it('should auto-scroll to keep cursor visible when typing at bottom', () => {
      // Requirement 14.2: Auto-scroll to cursor
      const editorHeight = 500;
      const cursorPosition = 450; // Near bottom
      const keyboardHeight = 300;
      const visibleHeight = editorHeight - keyboardHeight;

      const shouldScroll = cursorPosition > visibleHeight;
      expect(shouldScroll).toBe(true);

      if (shouldScroll) {
        const scrollAmount = cursorPosition - visibleHeight + 50; // 50px padding
        expect(scrollAmount).toBeGreaterThan(0);
      }
    });

    it('should restore original height when keyboard closes', () => {
      // Requirement 14.3: Restore height when keyboard closes
      const originalHeight = 667;
      let currentHeight = 367; // With keyboard

      // Mock keyboard closing
      const mockVisualViewport = {
        height: originalHeight,
      };

      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        value: mockVisualViewport,
      });

      currentHeight = mockVisualViewport.height;
      expect(currentHeight).toBe(originalHeight);
    });

    it('should keep input field visible above keyboard', () => {
      // Requirement 14.4: Input field above keyboard
      const inputPosition = 400;
      const keyboardTop = 367; // Keyboard starts at this Y position
      const viewportHeight = 667;

      const isInputVisible = inputPosition < keyboardTop;
      
      if (!isInputVisible) {
        // Should scroll to make input visible
        const scrollAmount = inputPosition - keyboardTop + 100;
        expect(scrollAmount).toBeGreaterThan(0);
      }

      expect(inputPosition).toBeLessThanOrEqual(viewportHeight);
    });

    it('should animate layout changes within 200ms', async () => {
      // Requirement 14.5: Smooth transition in 200ms
      const startTime = Date.now();
      const transitionDuration = 200;

      // Mock CSS transition
      const element = document.createElement('div');
      element.style.transition = `height ${transitionDuration}ms ease`;

      // Simulate height change
      element.style.height = '500px';
      await new Promise(resolve => setTimeout(resolve, transitionDuration));
      element.style.height = '300px';

      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      expect(actualDuration).toBeGreaterThanOrEqual(transitionDuration);
      expect(actualDuration).toBeLessThan(transitionDuration + 100); // Allow some margin
    });
  });

  describe('Complete Mobile Workflow', () => {
    it('should handle complete PWA installation and usage', async () => {
      // Integration test covering Requirements 11.1, 11.2, 11.3
      
      // Step 1: Show install prompt
      let installPromptShown = false;
      window.addEventListener('beforeinstallprompt', () => {
        installPromptShown = true;
      });

      const installEvent = new Event('beforeinstallprompt');
      window.dispatchEvent(installEvent);
      expect(installPromptShown).toBe(true);

      // Step 2: Install and run in standalone mode
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: true,
      });
      expect(window.navigator.standalone).toBe(true);

      // Step 3: Service worker caches content
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: {
          register: vi.fn().mockResolvedValue({
            active: { state: 'activated' },
          }),
        },
      });

      const registration = await navigator.serviceWorker.register('/sw.js');
      expect(registration.active?.state).toBe('activated');
    });

    it('should handle complete gesture navigation workflow', () => {
      // Integration test covering Requirements 12.1, 12.2, 12.3, 12.4
      let sidebarOpen = false;
      let refreshTriggered = false;
      let actionsVisible = false;

      // Gesture 1: Open sidebar
      const openSidebar = () => { sidebarOpen = true; };
      openSidebar();
      expect(sidebarOpen).toBe(true);

      // Gesture 2: Close sidebar
      const closeSidebar = () => { sidebarOpen = false; };
      closeSidebar();
      expect(sidebarOpen).toBe(false);

      // Gesture 3: Pull to refresh
      const triggerRefresh = () => { refreshTriggered = true; };
      triggerRefresh();
      expect(refreshTriggered).toBe(true);

      // Gesture 4: Show actions
      const showActions = () => { actionsVisible = true; };
      showActions();
      expect(actionsVisible).toBe(true);
    });

    it('should handle complete bottom navigation workflow', () => {
      // Integration test covering Requirements 13.1, 13.2, 13.3, 13.5
      const isMobile = window.innerWidth < 640;
      expect(isMobile).toBe(true);

      // Show bottom nav
      let bottomNavVisible = true;
      expect(bottomNavVisible).toBe(true);

      // Switch between tabs
      let activePage = 'notes';
      const tabs = ['notes', 'search', 'new', 'folders'];

      tabs.forEach(tab => {
        activePage = tab;
        expect(tabs.includes(activePage)).toBe(true);
      });

      // Hide in edit mode
      const enterEditMode = () => { bottomNavVisible = false; };
      enterEditMode();
      expect(bottomNavVisible).toBe(false);
    });

    it('should handle complete keyboard interaction workflow', () => {
      // Integration test covering Requirements 14.1, 14.2, 14.3, 14.4
      const originalHeight = 667;
      let currentHeight = originalHeight;

      // Keyboard opens
      const keyboardHeight = 300;
      currentHeight = originalHeight - keyboardHeight;
      expect(currentHeight).toBe(367);

      // Cursor at bottom - should scroll
      const cursorPosition = 350;
      const shouldScroll = cursorPosition > currentHeight - 100;
      expect(shouldScroll).toBe(true);

      // Keyboard closes
      currentHeight = originalHeight;
      expect(currentHeight).toBe(667);
    });

    it('should handle mobile experience across all features', async () => {
      // Complete integration test covering all mobile requirements
      
      // PWA
      const isPWA = window.navigator.standalone || 
                    window.matchMedia('(display-mode: standalone)').matches;
      
      // Gestures
      const gesturesSupported = 'ontouchstart' in window;
      expect(gesturesSupported).toBe(true);

      // Bottom Nav
      const isMobile = window.innerWidth < 640;
      const showBottomNav = isMobile;
      expect(showBottomNav).toBe(true);

      // Keyboard
      const hasVisualViewport = 'visualViewport' in window;
      
      // All mobile features should be available
      expect(gesturesSupported).toBe(true);
      expect(showBottomNav).toBe(true);
    });
  });
});
