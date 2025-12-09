"use client";

import { useEffect, useCallback, RefObject } from 'react';

/**
 * Hook for automatically scrolling to cursor position
 * Ensures cursor remains visible when keyboard opens on mobile
 */

interface UseScrollToCursorOptions {
  /**
   * Reference to the editor container element
   */
  editorRef?: RefObject<HTMLElement>;
  
  /**
   * Whether to enable auto-scroll
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Padding from bottom of viewport (in pixels)
   * @default 20
   */
  bottomPadding?: number;
  
  /**
   * Whether keyboard is currently open
   */
  isKeyboardOpen?: boolean;
}

export function useScrollToCursor(options: UseScrollToCursorOptions = {}) {
  const {
    editorRef,
    enabled = true,
    bottomPadding = 20,
    isKeyboardOpen = false,
  } = options;

  /**
   * Get the current cursor position in the editor
   */
  const getCursorPosition = useCallback((): DOMRect | null => {
    if (!editorRef?.current) return null;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    return rect;
  }, [editorRef]);

  /**
   * Check if cursor is visible in the current viewport
   */
  const isCursorVisible = useCallback((cursorRect: DOMRect): boolean => {
    if (!window.visualViewport) {
      // Fallback to window dimensions
      const viewportHeight = window.innerHeight;
      return (
        cursorRect.top >= 0 &&
        cursorRect.bottom <= viewportHeight - bottomPadding
      );
    }

    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport.pageTop;
    const viewportBottom = viewportTop + visualViewport.height;

    return (
      cursorRect.top >= viewportTop &&
      cursorRect.bottom <= viewportBottom - bottomPadding
    );
  }, [bottomPadding]);

  /**
   * Scroll to make cursor visible
   */
  const scrollToCursor = useCallback(() => {
    if (!enabled || !editorRef?.current) return;

    const cursorRect = getCursorPosition();
    if (!cursorRect) return;

    // Check if cursor is already visible
    if (isCursorVisible(cursorRect)) return;

    // Calculate scroll position
    let scrollTop: number;

    if (window.visualViewport) {
      const visualViewport = window.visualViewport;
      const viewportHeight = visualViewport.height;
      
      // Position cursor in the middle of visible viewport
      const targetPosition = cursorRect.top - (viewportHeight / 2);
      scrollTop = window.pageYOffset + targetPosition;
    } else {
      // Fallback calculation
      const viewportHeight = window.innerHeight;
      const targetPosition = cursorRect.top - (viewportHeight / 2);
      scrollTop = window.pageYOffset + targetPosition;
    }

    // Smooth scroll to position
    window.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    });
  }, [enabled, editorRef, getCursorPosition, isCursorVisible]);

  /**
   * Handle selection change events
   */
  const handleSelectionChange = useCallback(() => {
    if (!enabled || !isKeyboardOpen) return;

    // Delay to allow DOM to update
    requestAnimationFrame(() => {
      scrollToCursor();
    });
  }, [enabled, isKeyboardOpen, scrollToCursor]);

  /**
   * Handle input events in the editor
   */
  const handleInput = useCallback(() => {
    if (!enabled || !isKeyboardOpen) return;

    // Delay to allow DOM to update
    requestAnimationFrame(() => {
      scrollToCursor();
    });
  }, [enabled, isKeyboardOpen, scrollToCursor]);

  useEffect(() => {
    if (!enabled || !editorRef?.current) return;

    const editor = editorRef.current;

    // Listen to selection changes
    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Listen to input events in the editor
    editor.addEventListener('input', handleInput);
    editor.addEventListener('click', handleInput);
    editor.addEventListener('focus', handleInput);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('click', handleInput);
      editor.removeEventListener('focus', handleInput);
    };
  }, [enabled, editorRef, handleSelectionChange, handleInput]);

  // Scroll to cursor when keyboard opens
  useEffect(() => {
    if (isKeyboardOpen && enabled) {
      // Small delay to allow keyboard animation to complete
      setTimeout(() => {
        scrollToCursor();
      }, 100);
    }
  }, [isKeyboardOpen, enabled, scrollToCursor]);

  return {
    scrollToCursor,
    getCursorPosition,
    isCursorVisible,
  };
}
