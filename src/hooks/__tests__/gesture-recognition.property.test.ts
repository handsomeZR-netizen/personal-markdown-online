/**
 * Property-Based Tests for Gesture Recognition Accuracy
 * Feature: team-collaborative-knowledge-base, Property 11: Gesture Recognition Accuracy
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 * 
 * Tests that swipe gestures are correctly identified when the swipe distance exceeds 50 pixels.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGestureHandler, type SwipeDirection } from '../use-gesture-handler'
import fc from 'fast-check'

describe('Property 11: Gesture Recognition Accuracy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Property: For any swipe gesture on mobile devices, the system should correctly 
   * identify the direction (left/right/up/down) when the swipe distance exceeds 50 pixels.
   */
  it('should correctly identify swipe direction when distance exceeds threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random swipe gestures
        fc.record({
          startX: fc.integer({ min: 0, max: 1000 }),
          startY: fc.integer({ min: 0, max: 1000 }),
          deltaX: fc.integer({ min: -500, max: 500 }),
          deltaY: fc.integer({ min: -500, max: 500 }),
        }),
        async (gesture) => {
          const endX = gesture.startX + gesture.deltaX
          const endY = gesture.startY + gesture.deltaY

          const detectedDirections: SwipeDirection[] = []
          
          const { result } = renderHook(() =>
            useGestureHandler({
              onSwipe: (direction) => {
                detectedDirections.push(direction)
              },
              minSwipeDistance: 50,
            })
          )

          // Simulate touch events
          const touchStart = {
            touches: [{ clientX: gesture.startX, clientY: gesture.startY }],
          } as React.TouchEvent

          const touchEnd = {
            touches: [{ clientX: endX, clientY: endY }],
            changedTouches: [{ clientX: endX, clientY: endY }],
          } as unknown as React.TouchEvent

          act(() => {
            result.current.handlers.onTouchStart(touchStart)
          })

          act(() => {
            result.current.handlers.onTouchMove(touchEnd)
          })

          await act(async () => {
            result.current.handlers.onTouchEnd()
          })

          // Calculate expected direction
          const absDeltaX = Math.abs(gesture.deltaX)
          const absDeltaY = Math.abs(gesture.deltaY)
          const isHorizontal = absDeltaX > absDeltaY

          if (isHorizontal && absDeltaX > 50) {
            // Should detect horizontal swipe
            const expectedDirection: SwipeDirection = gesture.deltaX > 0 ? 'right' : 'left'
            expect(detectedDirections).toContain(expectedDirection)
          } else if (!isHorizontal && absDeltaY > 50) {
            // Should detect vertical swipe
            const expectedDirection: SwipeDirection = gesture.deltaY > 0 ? 'down' : 'up'
            expect(detectedDirections).toContain(expectedDirection)
          } else {
            // Should not detect any swipe (distance too small)
            expect(detectedDirections).toHaveLength(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Horizontal swipes should be correctly identified as left or right
   * based on the sign of deltaX when |deltaX| > |deltaY| and |deltaX| > 50px
   */
  it('should correctly identify horizontal swipe direction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startX: fc.integer({ min: 100, max: 900 }),
          startY: fc.integer({ min: 100, max: 900 }),
          deltaX: fc.integer({ min: 51, max: 400 }), // Ensure > 50px
          deltaY: fc.integer({ min: -25, max: 25 }), // Ensure horizontal dominance
          direction: fc.constantFrom('left', 'right'),
        }),
        async ({ startX, startY, deltaX, deltaY, direction }) => {
          const actualDeltaX = direction === 'left' ? -deltaX : deltaX
          const endX = startX + actualDeltaX
          const endY = startY + deltaY

          let detectedDirection: SwipeDirection | null = null

          const { result } = renderHook(() =>
            useGestureHandler({
              onSwipe: (dir) => {
                detectedDirection = dir
              },
              minSwipeDistance: 50,
            })
          )

          const touchStart = {
            touches: [{ clientX: startX, clientY: startY }],
          } as React.TouchEvent

          const touchEnd = {
            touches: [{ clientX: endX, clientY: endY }],
            changedTouches: [{ clientX: endX, clientY: endY }],
          } as unknown as React.TouchEvent

          act(() => {
            result.current.handlers.onTouchStart(touchStart)
          })

          act(() => {
            result.current.handlers.onTouchMove(touchEnd)
          })

          await act(async () => {
            result.current.handlers.onTouchEnd()
          })

          // Should detect the correct horizontal direction
          expect(detectedDirection).toBe(direction)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Vertical swipes should be correctly identified as up or down
   * based on the sign of deltaY when |deltaY| > |deltaX| and |deltaY| > 50px
   */
  it('should correctly identify vertical swipe direction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startX: fc.integer({ min: 100, max: 900 }),
          startY: fc.integer({ min: 100, max: 900 }),
          deltaX: fc.integer({ min: -25, max: 25 }), // Ensure vertical dominance
          deltaY: fc.integer({ min: 51, max: 400 }), // Ensure > 50px
          direction: fc.constantFrom('up', 'down'),
        }),
        async ({ startX, startY, deltaX, deltaY, direction }) => {
          const actualDeltaY = direction === 'up' ? -deltaY : deltaY
          const endX = startX + deltaX
          const endY = startY + actualDeltaY

          let detectedDirection: SwipeDirection | null = null

          const { result } = renderHook(() =>
            useGestureHandler({
              onSwipe: (dir) => {
                detectedDirection = dir
              },
              minSwipeDistance: 50,
            })
          )

          const touchStart = {
            touches: [{ clientX: startX, clientY: startY }],
          } as React.TouchEvent

          const touchEnd = {
            touches: [{ clientX: endX, clientY: endY }],
            changedTouches: [{ clientX: endX, clientY: endY }],
          } as unknown as React.TouchEvent

          act(() => {
            result.current.handlers.onTouchStart(touchStart)
          })

          act(() => {
            result.current.handlers.onTouchMove(touchEnd)
          })

          await act(async () => {
            result.current.handlers.onTouchEnd()
          })

          // Should detect the correct vertical direction
          expect(detectedDirection).toBe(direction)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Swipes below the minimum distance threshold should not trigger any gesture
   */
  it('should not trigger gesture when swipe distance is below threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startX: fc.integer({ min: 100, max: 900 }),
          startY: fc.integer({ min: 100, max: 900 }),
          deltaX: fc.integer({ min: -49, max: 49 }), // Below 50px threshold
          deltaY: fc.integer({ min: -49, max: 49 }), // Below 50px threshold
        }),
        async ({ startX, startY, deltaX, deltaY }) => {
          const endX = startX + deltaX
          const endY = startY + deltaY

          let gestureTriggered = false

          const { result } = renderHook(() =>
            useGestureHandler({
              onSwipe: () => {
                gestureTriggered = true
              },
              minSwipeDistance: 50,
            })
          )

          const touchStart = {
            touches: [{ clientX: startX, clientY: startY }],
          } as React.TouchEvent

          const touchEnd = {
            touches: [{ clientX: endX, clientY: endY }],
            changedTouches: [{ clientX: endX, clientY: endY }],
          } as unknown as React.TouchEvent

          act(() => {
            result.current.handlers.onTouchStart(touchStart)
          })

          act(() => {
            result.current.handlers.onTouchMove(touchEnd)
          })

          await act(async () => {
            result.current.handlers.onTouchEnd()
          })

          // Should not trigger any gesture
          expect(gestureTriggered).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Edge swipe detection should correctly identify left or right edge
   */
  it('should correctly detect edge swipes', async () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1000,
    })

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startX: fc.oneof(
            fc.integer({ min: 0, max: 30 }), // Left edge
            fc.integer({ min: 970, max: 1000 }) // Right edge
          ),
          startY: fc.integer({ min: 100, max: 900 }),
        }),
        async ({ startX, startY }) => {
          const { result } = renderHook(() =>
            useGestureHandler({
              edgeSwipeThreshold: 30,
            })
          )

          const touchStart = {
            touches: [{ clientX: startX, clientY: startY }],
          } as React.TouchEvent

          act(() => {
            result.current.handlers.onTouchStart(touchStart)
          })

          const edgeDirection = result.current.getEdgeSwipeDirection()

          // Should detect correct edge
          if (startX <= 30) {
            expect(edgeDirection).toBe('left')
          } else if (startX >= 970) {
            expect(edgeDirection).toBe('right')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Double tap should be detected when two taps occur within the delay threshold
   */
  it('should detect double tap within delay threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          x: fc.integer({ min: 100, max: 900 }),
          y: fc.integer({ min: 100, max: 900 }),
          delay: fc.integer({ min: 50, max: 250 }), // Within 300ms threshold
        }),
        async ({ x, y, delay }) => {
          let doubleTapDetected = false

          const { result } = renderHook(() =>
            useGestureHandler({
              onDoubleTap: () => {
                doubleTapDetected = true
              },
              doubleTapDelay: 300,
            })
          )

          const touchEvent = {
            touches: [{ clientX: x, clientY: y }],
          } as React.TouchEvent

          // First tap
          await act(async () => {
            result.current.handlers.onTouchStart(touchEvent)
          })

          // Wait for delay
          await new Promise((resolve) => setTimeout(resolve, delay))

          // Second tap
          await act(async () => {
            result.current.handlers.onTouchStart(touchEvent)
          })

          // Should detect double tap
          expect(doubleTapDetected).toBe(true)
        }
      ),
      { numRuns: 20, timeout: 10000 } // Fewer runs with longer timeout due to timing
    )
  }, 15000)

  /**
   * Property: Pull-to-refresh should trigger when pull distance exceeds threshold
   */
  it('should trigger pull-to-refresh when threshold is exceeded', async () => {
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startY: fc.integer({ min: 100, max: 500 }),
          pullDistance: fc.integer({ min: 121, max: 200 }), // Above 60px threshold after damping (distance * 0.5)
        }),
        async ({ startY, pullDistance }) => {
          let refreshTriggered = false

          const { result } = renderHook(() =>
            useGestureHandler({
              onPullToRefresh: async () => {
                refreshTriggered = true
              },
              pullToRefreshThreshold: 60,
            })
          )

          const touchStart = {
            touches: [{ clientX: 500, clientY: startY }],
            preventDefault: vi.fn(),
          } as unknown as React.TouchEvent

          const touchMove = {
            touches: [{ clientX: 500, clientY: startY + pullDistance }],
            preventDefault: vi.fn(),
          } as unknown as React.TouchEvent

          await act(async () => {
            result.current.handlers.onTouchStart(touchStart)
          })

          await act(async () => {
            result.current.handlers.onTouchMove(touchMove)
          })

          // Wait for state update
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
          })

          await act(async () => {
            await result.current.handlers.onTouchEnd()
          })

          // Wait for async refresh to complete
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
          })

          // Should trigger refresh
          expect(refreshTriggered).toBe(true)
        }
      ),
      { numRuns: 30 } // Fewer runs due to async operations
    )
  })
})
