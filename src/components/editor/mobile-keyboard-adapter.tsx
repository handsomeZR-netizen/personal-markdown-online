"use client";

import { useRef, useEffect, ReactNode } from 'react';
import { useKeyboardViewport } from '@/hooks/use-keyboard-viewport';
import { useScrollToCursor } from '@/hooks/use-scroll-to-cursor';

/**
 * Mobile Keyboard Adapter Component
 * Wraps editor content and handles keyboard viewport adjustments
 * with smooth transitions
 */

interface MobileKeyboardAdapterProps {
  children: ReactNode;
  /**
   * Whether to enable keyboard adaptation
   * @default true on mobile devices
   */
  enabled?: boolean;
  /**
   * CSS class name for the container
   */
  className?: string;
}

export function MobileKeyboardAdapter({
  children,
  enabled,
  className = '',
}: MobileKeyboardAdapterProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Auto-detect mobile device if enabled is not specified
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isEnabled = enabled !== undefined ? enabled : isMobile;

  // Use keyboard viewport hook
  const keyboardState = useKeyboardViewport({
    editorRef,
    enabled: isEnabled,
    keyboardThreshold: 150,
  });

  // Use scroll to cursor hook
  useScrollToCursor({
    editorRef,
    enabled: isEnabled,
    isKeyboardOpen: keyboardState.isKeyboardOpen,
    bottomPadding: 20,
  });

  // Add CSS transitions
  useEffect(() => {
    if (!editorRef.current || !isEnabled) return;

    const editor = editorRef.current;
    
    // Add transition styles
    editor.style.transition = 'height 200ms ease-out, max-height 200ms ease-out';
    
    return () => {
      // Clean up transition styles
      editor.style.transition = '';
    };
  }, [isEnabled]);

  // Add visual feedback when keyboard is open
  useEffect(() => {
    if (!editorRef.current || !isEnabled) return;

    const editor = editorRef.current;
    
    if (keyboardState.isKeyboardOpen) {
      editor.classList.add('keyboard-open');
    } else {
      editor.classList.remove('keyboard-open');
    }
  }, [keyboardState.isKeyboardOpen, isEnabled]);

  return (
    <div
      ref={editorRef}
      className={`mobile-keyboard-adapter ${className}`}
      data-keyboard-open={keyboardState.isKeyboardOpen}
      data-keyboard-height={keyboardState.keyboardHeight}
    >
      {children}
      
      {/* Add global styles for smooth transitions */}
      <style jsx global>{`
        .mobile-keyboard-adapter {
          position: relative;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .mobile-keyboard-adapter.keyboard-open {
          /* Ensure content is scrollable when keyboard is open */
          overflow-y: auto;
        }
        
        /* Smooth transition for height changes */
        .mobile-keyboard-adapter {
          transition: height 200ms ease-out, max-height 200ms ease-out;
        }
        
        /* Prevent layout shift during keyboard animation */
        @media (max-width: 768px) {
          .mobile-keyboard-adapter {
            will-change: height;
          }
        }
        
        /* Ensure editor content is visible during transition */
        .mobile-keyboard-adapter > * {
          transition: opacity 200ms ease-out;
        }
        
        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }
        
        /* Prevent bounce effect on iOS */
        body {
          overscroll-behavior-y: none;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook version for more control
 */
export function useMobileKeyboardAdapter(enabled?: boolean) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Auto-detect mobile device if enabled is not specified
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isEnabled = enabled !== undefined ? enabled : isMobile;

  // Use keyboard viewport hook
  const keyboardState = useKeyboardViewport({
    editorRef,
    enabled: isEnabled,
    keyboardThreshold: 150,
  });

  // Use scroll to cursor hook
  const scrollUtils = useScrollToCursor({
    editorRef,
    enabled: isEnabled,
    isKeyboardOpen: keyboardState.isKeyboardOpen,
    bottomPadding: 20,
  });

  return {
    editorRef,
    keyboardState,
    scrollUtils,
    isEnabled,
  };
}
