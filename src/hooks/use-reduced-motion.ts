import { useEffect, useState } from 'react'

/**
 * Hook to detect if user prefers reduced motion
 * Respects system accessibility settings
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }
    
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
