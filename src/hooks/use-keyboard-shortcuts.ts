import { useEffect, useCallback } from 'react'

export type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  callback: (event: KeyboardEvent) => void
  preventDefault?: boolean
}

/**
 * Hook for handling keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param enabled - Whether the shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      for (const shortcut of shortcuts) {
        const ctrlKey = shortcut.ctrl ?? false
        const metaKey = shortcut.meta ?? false
        const shiftKey = shortcut.shift ?? false
        const altKey = shortcut.alt ?? false

        // Check if the key matches
        const keyMatches = event.key?.toLowerCase() === shortcut.key.toLowerCase()
        
        // Check if modifiers match
        const ctrlMatches = ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
        const shiftMatches = shiftKey ? event.shiftKey : !event.shiftKey
        const altMatches = altKey ? event.altKey : !event.altKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.callback(event)
          break
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Hook for handling a single keyboard shortcut
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
    alt?: boolean
    preventDefault?: boolean
    enabled?: boolean
  } = {}
) {
  const { enabled = true, ...modifiers } = options

  useKeyboardShortcuts(
    [
      {
        key,
        ...modifiers,
        callback,
      },
    ],
    enabled
  )
}
