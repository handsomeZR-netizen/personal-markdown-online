"use client";

/**
 * Magic Border Component
 * A glowing border effect that follows mouse movement
 * Inspired by "Magic Card" effect with gradient border beam
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MagicBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Glow intensity (0-1) */
  glowIntensity?: number;
  /** Whether to enable the effect */
  enabled?: boolean;
  /** Gradient colors for the glow */
  gradientColors?: {
    from: string;
    via?: string;
    to: string;
  };
}

export function MagicBorder({
  children,
  className,
  borderRadius = 8,
  glowIntensity = 0.5,
  enabled = true,
  gradientColors = {
    from: "rgb(139, 92, 246)", // violet-500
    via: "rgb(59, 130, 246)",  // blue-500
    to: "rgb(147, 51, 234)",   // purple-600
  },
}: MagicBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !enabled) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  }, [enabled]);

  const handleMouseEnter = useCallback(() => {
    if (enabled) setIsHovered(true);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative group", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ borderRadius }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.via || gradientColors.from}, ${gradientColors.to})`,
          borderRadius: borderRadius + 1,
        }}
      />

      {/* Mouse-following glow effect */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? glowIntensity : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${gradientColors.from}40, transparent 40%)`,
          borderRadius: borderRadius + 1,
        }}
      />

      {/* Animated border beam (subtle flowing effect) */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] pointer-events-none overflow-hidden"
        style={{ borderRadius: borderRadius + 1 }}
      >
        <div
          className={cn(
            "absolute inset-0 opacity-0 dark:opacity-60 transition-opacity duration-500",
            isHovered && "opacity-30 dark:opacity-80"
          )}
          style={{
            background: `conic-gradient(from var(--border-angle, 0deg) at 50% 50%, transparent 0%, ${gradientColors.from} 10%, ${gradientColors.via || gradientColors.to} 20%, ${gradientColors.to} 30%, transparent 40%)`,
            animation: "border-beam 4s linear infinite",
          }}
        />
      </div>

      {/* Content container with background */}
      <div
        className="relative bg-background rounded-[inherit] overflow-hidden"
        style={{ borderRadius }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Simplified version for static glow effect (no mouse tracking)
 */
export function GlowBorder({
  children,
  className,
  borderRadius = 8,
  glowIntensity = 0.3,
  enabled = true,
  gradientColors = {
    from: "rgb(139, 92, 246)",
    via: "rgb(59, 130, 246)",
    to: "rgb(147, 51, 234)",
  },
}: MagicBorderProps) {
  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn("relative group", className)}
      style={{ borderRadius }}
    >
      {/* Static gradient border */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] opacity-20 dark:opacity-40 group-hover:opacity-40 dark:group-hover:opacity-70 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.via || gradientColors.from}, ${gradientColors.to})`,
          borderRadius: borderRadius + 1,
        }}
      />

      {/* Animated border beam */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] pointer-events-none overflow-hidden"
        style={{ borderRadius: borderRadius + 1 }}
      >
        <div
          className="absolute inset-0 opacity-0 dark:opacity-40 group-hover:opacity-20 dark:group-hover:opacity-60 transition-opacity duration-500"
          style={{
            background: `conic-gradient(from var(--border-angle, 0deg) at 50% 50%, transparent 0%, ${gradientColors.from} 10%, ${gradientColors.via || gradientColors.to} 20%, ${gradientColors.to} 30%, transparent 40%)`,
            animation: "border-beam 4s linear infinite",
          }}
        />
      </div>

      {/* Content container */}
      <div
        className="relative bg-background rounded-[inherit] overflow-hidden"
        style={{ borderRadius }}
      >
        {children}
      </div>
    </div>
  );
}
