"use client"

import Image, { ImageProps } from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Skeleton } from './skeleton'

interface LazyImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  skeletonClassName?: string
  fallbackSrc?: string
  onLoad?: () => void
  onError?: () => void
  threshold?: number // Intersection observer threshold
  rootMargin?: string // Intersection observer root margin
}

/**
 * LazyImage Component
 * 
 * Performance optimizations:
 * - Lazy loading with Intersection Observer
 * - Loading placeholder with skeleton
 * - Error handling with fallback image
 * - Responsive image support
 * - Automatic blur placeholder
 */
export function LazyImage({ 
  skeletonClassName, 
  className,
  fallbackSrc = '/placeholder-image.png',
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...props 
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Use Intersection Observer for better lazy loading control
  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  return (
    <div ref={imgRef} className="relative">
      {isLoading && !hasError && (
        <Skeleton 
          className={skeletonClassName || className} 
        />
      )}
      {isInView && (
        <Image
          {...props}
          src={hasError ? fallbackSrc : props.src}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          style={isLoading ? { display: 'none' } : undefined}
        />
      )}
    </div>
  )
}
