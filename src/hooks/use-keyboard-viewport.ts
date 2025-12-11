"use client";

import { useEffect, useState, useCallback, RefObject } from 'react';

/**
 * Hook for handling mobile keyboard viewport adjustments
 * Uses Visual Viewport API to detect keyboard open/close events
 * and adjusts editor height accordingly
 */

interface KeyboardViewportState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  availableHeight: number;
  viewportHeight: number;
}

interface UseKeyboardViewportOptions {
  /**
   * Reference to the editor element that should be adjusted
   */
  editorRef?: RefObject<HTMLElement | null>;
  
  /**
   * Whether to enable automatic height adjustment
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Callback when keyboard state changes
   */
  onKeyboardChange?: (state: KeyboardViewportState) => void;
  
  /**
   * Minimum height threshold to consider keyboard as open (in pixels)
   * @default 150
   */
  keyboardThreshold?: number;
}

export function useKeyboardViewport(options: UseKeyboardViewportOptions = {}) {
  const {
    editorRef,
    enabled = true,
    onKeyboardChange,
    keyboardThreshold = 150,
  } = options;

  const [keyboardState, setKeyboardState] = useState<KeyboardViewportState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
    availableHeight: window.innerHeight,
    viewportHeight: window.innerHeight,
  });

  const handleViewportResize = useCallback(() => {
    if (!enabled) return;

    // Check if Visual Viewport API is supported
    if (!window.visualViewport) {
      console.warn('Visual Viewport API not supported');
      return;
    }

    const visualViewport = window.visualViewport;
    const windowHeight = window.innerHeight;
    const viewportHeight = visualViewport.height;
    
    // Calculate keyboard height
    // When keyboard opens, visual viewport height decreases
    const keyboardHeight = windowHeight - viewportHeight;
    const isKeyboardOpen = keyboardHeight > keyboardThreshold;

    const newState: KeyboardViewportState = {
      isKeyboardOpen,
      keyboardHeight: isKeyboardOpen ? keyboardHeight : 0,
      availableHeight: viewportHeight,
      viewportHeight: windowHeight,
    };

    setKeyboardState(newState);

    // Adjust editor height if ref is provided
    if (editorRef?.current && isKeyboardOpen) {
      const editor = editorRef.current;
      
      // Calculate available height for editor
      const editorRect = editor.getBoundingClientRect();
      const editorTop = editorRect.top;
      const availableEditorHeight = viewportHeight - editorTop - 16; // 16px padding
      
      // Apply height with smooth transition
      editor.style.transition = 'height 200ms ease-out';
      editor.style.height = `${Math.max(availableEditorHeight, 200)}px`;
      editor.style.maxHeight = `${availableEditorHeight}px`;
    } else if (editorRef?.current && !isKeyboardOpen) {
      // Reset editor height when keyboard closes
      const editor = editorRef.current;
      editor.style.transition = 'height 200ms ease-out';
      editor.style.height = '';
      editor.style.maxHeight = '';
    }

    // Notify callback
    if (onKeyboardChange) {
      onKeyboardChange(newState);
    }
  }, [enabled, editorRef, onKeyboardChange, keyboardThreshold]);

  useEffect(() => {
    if (!enabled) return;

    // Check if Visual Viewport API is supported
    if (!window.visualViewport) {
      console.warn('Visual Viewport API not supported in this browser');
      return;
    }

    const visualViewport = window.visualViewport;

    // Listen to viewport resize events
    visualViewport.addEventListener('resize', handleViewportResize);
    visualViewport.addEventListener('scroll', handleViewportResize);

    // Initial check
    handleViewportResize();

    return () => {
      visualViewport.removeEventListener('resize', handleViewportResize);
      visualViewport.removeEventListener('scroll', handleViewportResize);
      
      // Reset editor height on cleanup
      if (editorRef?.current) {
        editorRef.current.style.height = '';
        editorRef.current.style.maxHeight = '';
        editorRef.current.style.transition = '';
      }
    };
  }, [enabled, handleViewportResize, editorRef]);

  return keyboardState;
}
