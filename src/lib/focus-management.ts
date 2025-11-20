/**
 * Focus management utilities for keyboard navigation
 */

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => {
      // Check if element is visible
      return (
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        window.getComputedStyle(element).visibility !== 'hidden'
      )
    }
  )
}

/**
 * Move focus to the next focusable element
 */
export function focusNext(currentElement: HTMLElement, container?: HTMLElement): void {
  const root = container || document.body
  const focusableElements = getFocusableElements(root)
  const currentIndex = focusableElements.indexOf(currentElement)

  if (currentIndex === -1) return

  const nextIndex = (currentIndex + 1) % focusableElements.length
  focusableElements[nextIndex]?.focus()
}

/**
 * Move focus to the previous focusable element
 */
export function focusPrevious(currentElement: HTMLElement, container?: HTMLElement): void {
  const root = container || document.body
  const focusableElements = getFocusableElements(root)
  const currentIndex = focusableElements.indexOf(currentElement)

  if (currentIndex === -1) return

  const previousIndex =
    currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
  focusableElements[previousIndex]?.focus()
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirst(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container)
  focusableElements[0]?.focus()
}

/**
 * Focus the last focusable element in a container
 */
export function focusLast(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container)
  focusableElements[focusableElements.length - 1]?.focus()
}

/**
 * Restore focus to a previously focused element
 */
export function restoreFocus(element: HTMLElement | null): void {
  if (element && document.body.contains(element)) {
    element.focus()
  }
}

/**
 * Save the currently focused element
 */
export function saveFocus(): HTMLElement | null {
  return document.activeElement as HTMLElement | null
}
