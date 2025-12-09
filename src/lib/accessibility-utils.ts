/**
 * Accessibility utilities for maintaining WCAG 2.1 AA compliance
 */

/**
 * Generate a unique ID for ARIA attributes
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within an element (for modals/dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to a previously focused element
 */
export function createFocusManager() {
  let previouslyFocused: HTMLElement | null = null;

  return {
    saveFocus() {
      previouslyFocused = document.activeElement as HTMLElement;
    },
    restoreFocus() {
      previouslyFocused?.focus();
      previouslyFocused = null;
    },
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get accessible name for an element
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check associated label
  if (element instanceof HTMLInputElement) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }

  // Fallback to text content
  return element.textContent || '';
}

/**
 * Check if element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const tabIndex = element.getAttribute('tabindex');
  
  // Elements with tabindex="-1" are not keyboard accessible
  if (tabIndex === '-1') return false;

  // Interactive elements are keyboard accessible by default
  const interactiveElements = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  if (interactiveElements.includes(element.tagName)) return true;

  // Elements with tabindex >= 0 are keyboard accessible
  if (tabIndex && parseInt(tabIndex) >= 0) return true;

  return false;
}

/**
 * Validate color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Simple RGB extraction (assumes hex format)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Add skip link to page
 */
export function addSkipLink(targetId: string, text: string = '跳转到主内容') {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-black';
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Ensure minimum touch target size (44x44px for WCAG 2.1 AAA)
 */
export function ensureTouchTargetSize(element: HTMLElement, minSize: number = 44) {
  const rect = element.getBoundingClientRect();
  
  if (rect.width < minSize || rect.height < minSize) {
    console.warn(
      `Touch target too small: ${rect.width}x${rect.height}px. Minimum: ${minSize}x${minSize}px`,
      element
    );
  }
}

/**
 * Validate form accessibility
 */
export function validateFormAccessibility(form: HTMLFormElement): string[] {
  const errors: string[] = [];

  // Check all inputs have labels
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const accessibleName = getAccessibleName(input as HTMLElement);
    if (!accessibleName) {
      errors.push(`Input missing label: ${input.getAttribute('name') || 'unknown'}`);
    }
  });

  // Check required fields are marked
  const requiredInputs = form.querySelectorAll('[required]');
  requiredInputs.forEach((input) => {
    if (!input.hasAttribute('aria-required')) {
      errors.push(`Required field missing aria-required: ${input.getAttribute('name')}`);
    }
  });

  // Check error messages are associated
  const invalidInputs = form.querySelectorAll('[aria-invalid="true"]');
  invalidInputs.forEach((input) => {
    if (!input.hasAttribute('aria-describedby')) {
      errors.push(`Invalid field missing error message: ${input.getAttribute('name')}`);
    }
  });

  return errors;
}

/**
 * Create accessible loading state
 */
export function createLoadingState(message: string = '加载中'): HTMLElement {
  const container = document.createElement('div');
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-busy', 'true');
  container.setAttribute('aria-label', message);
  
  const spinner = document.createElement('div');
  spinner.setAttribute('aria-hidden', 'true');
  spinner.className = 'animate-spin';
  spinner.textContent = '⏳';
  
  const text = document.createElement('span');
  text.className = 'sr-only';
  text.textContent = message;
  
  container.appendChild(spinner);
  container.appendChild(text);
  
  return container;
}

/**
 * Keyboard event helpers
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === KeyboardKeys.ENTER || event.key === KeyboardKeys.SPACE;
}

export function isNavigationKey(event: KeyboardEvent): boolean {
  return [
    KeyboardKeys.ARROW_UP,
    KeyboardKeys.ARROW_DOWN,
    KeyboardKeys.ARROW_LEFT,
    KeyboardKeys.ARROW_RIGHT,
    KeyboardKeys.HOME,
    KeyboardKeys.END,
  ].includes(event.key as any);
}
