"use client"

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { Skeleton } from './skeleton'

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  skeletonClassName?: string
}

export function LazyImage({ 
  skeletonClassName, 
  className,
  ...props 
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative">
      {isLoading && (
        <Skeleton 
          className={skeletonClassName || className} 
        />
      )}
      <Image
        {...props}
        className={className}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        style={isLoading ? { display: 'none' } : undefined}
      />
    </div>
  )
}
