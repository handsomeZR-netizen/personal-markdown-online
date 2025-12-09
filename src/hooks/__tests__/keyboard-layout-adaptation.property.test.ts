/**
 * Property-Based Tests for Keyboard Layout Adaptation
 * Feature: team-collaborative-knowledge-base, Property 12: Keyboard Layout Adaptation
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4
 * 
 * Tests that the editor viewport adjusts to keep the cursor visible when the keyboard appears on mobile devices.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useKeyboardViewport } from '../use-keyboard-viewport'
import { useScrollToCursor } from '../use-scroll-to-cursor'
import fc from 'fast-check'
import { RefObject } from 'react'

describe('Property 12: Keyboard Layout Adaptation', () => {
  let mockVisualViewport: any
  let originalVisualViewport: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Save original visualViewport
    originalVisualViewport = window.visualViewport

    // Create event listeners storage
    const listeners: Map<string, Set<EventListener>> = new Map()

    // Mock Visual Viewport API with working event listeners
    mockVisualViewport = {
      height: 800,
      width: 400,
      pageTop: 0,
      pageLeft: 0,
      addEventListener: vi.fn((event: string, callback: EventListener) => {
        if (!listeners.has(event)) {
          listeners.set(event, new Set())
        }
        listeners.get(event)!.add(callback)
      }),
      removeEventListener: vi.fn((event: string, callback: EventListener) => {
        listeners.get(event)?.delete(callback)
      }),
      dispatchEvent: (event: string) => {
        listeners.get(event)?.forEach(callback => callback(new Event(event)))
      },
    }

    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: mockVisualViewport,
    })

    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    })
  })

  afterEach(() => {
    // Restore original visualViewport
    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: originalVisualViewport,
    })
  })

  /**
   * Property: For any mobile device, when the keyboard appears, the editor viewport 
   * should adjust to keep the cursor visible without manual scrolling.
   */
  it('should adjust viewport height when keyboard opens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialHeight: fc.integer({ min: 600, max: 1000 }),
          keyboardHeight: fc.integer({ min: 200, max: 400 }),
        }),
        async ({ initialHeight, keyboardHeight }) => {
          // Setup initial state
          window.innerHeight = initialHeight
          mockVisualViewport.height = initialHeight

          // Create mock editor ref
          const mockEditor = document.createElement('div')
          mockEditor.style.height = '500px'
          document.body.appendChild(mockEditor)

          const editorRef = {
            current: mockEditor,
          } as RefObject<HTMLDivElement>

          const { result } = renderHook(() =>
            useKeyboardViewport({
              editorRef,
              enabled: true,
              keyboardThreshold: 150,
            })
          )

          // Initial state - keyboard closed
          expect(result.current.isKeyboardOpen).toBe(false)

          // Simulate keyboard opening
          await act(async () => {
            mockVisualViewport.height = initialHeight - keyboardHeight
            
            // Trigger resize event
            mockVisualViewport.dispatchEvent('resize')
          })

          // Wait for state update
          await waitFor(() => {
            expect(result.current.isKeyboardOpen).toBe(keyboardHeight > 150)
          })

          if (keyboardHeight > 150) {
            // Keyboard should be detected as open
            expect(result.current.isKeyboardOpen).toBe(true)
            expect(result.current.keyboardHeight).toBe(keyboardHeight)
            expect(result.current.availableHeight).toBe(initialHeight - keyboardHeight)

            // Editor height should be adjusted
            const editorHeight = parseInt(mockEditor.style.height)
            expect(editorHeight).toBeGreaterThan(0)
            expect(editorHeight).toBeLessThanOrEqual(initialHeight - keyboardHeight)
          } else {
            // Keyboard height below threshold - should not be detected
            expect(result.current.isKeyboardOpen).toBe(false)
          }

          // Cleanup
          document.body.removeChild(mockEditor)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: When keyboard closes, editor height should be restored to original state
   */
  it('should restore editor height when keyboard closes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialHeight: fc.integer({ min: 600, max: 1000 }),
          keyboardHeight: fc.integer({ min: 200, max: 400 }),
        }),
        async ({ initialHeight, keyboardHeight }) => {
          // Setup
          window.innerHeight = initialHeight
          mockVisualViewport.height = initialHeight

          const mockEditor = document.createElement('div')
          mockEditor.style.height = '500px'
          const originalHeight = mockEditor.style.height
          document.body.appendChild(mockEditor)

          const editorRef = {
            current: mockEditor,
          } as RefObject<HTMLDivElement>

          const { result } = renderHook(() =>
            useKeyboardViewport({
              editorRef,
              enabled: true,
              keyboardThreshold: 150,
            })
          )

          // Open keyboard
          await act(async () => {
            mockVisualViewport.height = initialHeight - keyboardHeight
            mockVisualViewport.dispatchEvent('resize')
          })

          await waitFor(() => {
            if (keyboardHeight > 150) {
              expect(result.current.isKeyboardOpen).toBe(true)
            }
          })

          // Close keyboard
          await act(async () => {
            mockVisualViewport.height = initialHeight
            mockVisualViewport.dispatchEvent('resize')
          })

          await waitFor(() => {
            expect(result.current.isKeyboardOpen).toBe(false)
          })

          // Editor height should be restored (empty string means auto)
          expect(mockEditor.style.height).toBe('')

          // Cleanup
          document.body.removeChild(mockEditor)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Cursor should remain visible when keyboard opens
   */
  it('should keep cursor visible when keyboard opens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          viewportHeight: fc.integer({ min: 600, max: 1000 }),
          keyboardHeight: fc.integer({ min: 200, max: 400 }),
          cursorTop: fc.integer({ min: 300, max: 700 }),
        }),
        async ({ viewportHeight, keyboardHeight, cursorTop }) => {
          // Setup
          window.innerHeight = viewportHeight
          mockVisualViewport.height = viewportHeight
          mockVisualViewport.pageTop = 0

          const mockEditor = document.createElement('div')
          mockEditor.style.height = '800px'
          document.body.appendChild(mockEditor)

          const editorRef = {
            current: mockEditor,
          } as RefObject<HTMLDivElement>

          // Mock selection and range
          const mockRange = {
            getBoundingClientRect: vi.fn(() => ({
              top: cursorTop,
              bottom: cursorTop + 20,
              left: 100,
              right: 100,
              width: 0,
              height: 20,
              x: 100,
              y: cursorTop,
              toJSON: () => ({}),
            })),
          }

          const mockSelection = {
            rangeCount: 1,
            getRangeAt: vi.fn(() => mockRange),
          }

          Object.defineProperty(window, 'getSelection', {
            writable: true,
            configurable: true,
            value: () => mockSelection,
          })

          // Mock scrollTo
          const scrollToMock = vi.fn()
          window.scrollTo = scrollToMock

          const { result: keyboardResult } = renderHook(() =>
            useKeyboardViewport({
              editorRef,
              enabled: true,
              keyboardThreshold: 150,
            })
          )

          const { result: scrollResult } = renderHook(() =>
            useScrollToCursor({
              editorRef,
              enabled: true,
              isKeyboardOpen: false,
            })
          )

          // Open keyboard
          await act(async () => {
            mockVisualViewport.height = viewportHeight - keyboardHeight
            mockVisualViewport.dispatchEvent('resize')
          })

          await waitFor(() => {
            if (keyboardHeight > 150) {
              expect(keyboardResult.current.isKeyboardOpen).toBe(true)
            }
          })

          if (keyboardHeight > 150) {
            const availableHeight = viewportHeight - keyboardHeight

            // Check if cursor would be visible
            const isCursorVisible = cursorTop < availableHeight - 20

            if (!isCursorVisible) {
              // Scroll should be triggered to make cursor visible
              await act(async () => {
                scrollResult.current.scrollToCursor()
              })

              // scrollTo should have been called
              expect(scrollToMock).toHaveBeenCalled()
            }
          }

          // Cleanup
          document.body.removeChild(mockEditor)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Height transitions should complete within 200ms
   */
  it('should apply smooth transitions within 200ms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialHeight: fc.integer({ min: 600, max: 1000 }),
          keyboardHeight: fc.integer({ min: 200, max: 400 }),
        }),
        async ({ initialHeight, keyboardHeight }) => {
          // Setup
          window.innerHeight = initialHeight
          mockVisualViewport.height = initialHeight

          const mockEditor = document.createElement('div')
          document.body.appendChild(mockEditor)

          const editorRef = {
            current: mockEditor,
          } as RefObject<HTMLDivElement>

          renderHook(() =>
            useKeyboardViewport({
              editorRef,
              enabled: true,
              keyboardThreshold: 150,
            })
          )

          // Open keyboard
          await act(async () => {
            mockVisualViewport.height = initialHeight - keyboardHeight
            mockVisualViewport.dispatchEvent('resize')
          })

          // Check transition property
          const transition = mockEditor.style.transition
          
          if (keyboardHeight > 150) {
            // Should have transition applied
            expect(transition).toContain('200ms')
            expect(transition).toContain('ease-out')
          }

          // Cleanup
          document.body.removeChild(mockEditor)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Keyboard threshold should correctly determine keyboard state
   */
  it('should respect keyboard threshold for detection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          viewportHeight: fc.integer({ min: 600, max: 1000 }),
          heightReduction: fc.integer({ min: 50, max: 500 }),
          threshold: fc.integer({ min: 100, max: 200 }),
        }),
        async ({ viewportHeight, heightReduction, threshold }) => {
          // Setup
          window.innerHeight = viewportHeight
          mockVisualViewport.height = viewportHeight

          const mockEditor = document.createElement('div')
          document.body.appendChild(mockEditor)

          const editorRef = {
            current: mockEditor,
          } as RefObject<HTMLDivElement>

          const { result } = renderHook(() =>
            useKeyboardViewport({
              editorRef,
              enabled: true,
              keyboardThreshold: threshold,
            })
          )

          // Reduce viewport height
          await act(async () => {
            mockVisualViewport.height = viewportHeight - heightReduction
            mockVisualViewport.dispatchEvent('resize')
          })

          await waitFor(() => {
            const expectedOpen = heightReduction > threshold
            expect(result.current.isKeyboardOpen).toBe(expectedOpen)
          })

          // Cleanup
          document.body.removeChild(mockEditor)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Multiple rapid keyboard open/close cycles should maintain consistency
   */
  it('should handle rapid keyboard state changes consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialHeight: fc.integer({ min: 600, max: 1000 }),
          keyboardHeight: fc.integer({ min: 200, max: 400 }),
          cycles: fc.integer({ min: 2, max: 3 }), // Reduced cycles for faster test
        }),
        async ({ initialHeight, keyboardHeight, cycles }) => {
          // Setup
          window.innerHeight = initialHeight
          mockVisualViewport.height = initialHeight

          const mockEditor = document.createElement('div')
          document.body.appendChild(mockEditor)

          const editorRef = {
            current: mockEditor,
          } as RefObject<HTMLDivElement>

          const { result } = renderHook(() =>
            useKeyboardViewport({
              editorRef,
              enabled: true,
              keyboardThreshold: 150,
            })
          )

          // Perform multiple open/close cycles
          for (let i = 0; i < cycles; i++) {
            // Open keyboard
            await act(async () => {
              mockVisualViewport.height = initialHeight - keyboardHeight
              mockVisualViewport.dispatchEvent('resize')
            })

            // Small delay for state update
            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 10))
            })

            if (keyboardHeight > 150) {
              expect(result.current.isKeyboardOpen).toBe(true)
            }

            // Close keyboard
            await act(async () => {
              mockVisualViewport.height = initialHeight
              mockVisualViewport.dispatchEvent('resize')
            })

            // Small delay for state update
            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 10))
            })

            expect(result.current.isKeyboardOpen).toBe(false)
          }

          // Final state should be consistent (keyboard closed)
          expect(result.current.isKeyboardOpen).toBe(false)
          expect(mockEditor.style.height).toBe('')

          // Cleanup
          document.body.removeChild(mockEditor)
        }
      ),
      { numRuns: 30 } // Fewer runs due to multiple cycles
    )
  }, 10000) // Increased timeout to 10 seconds
})

