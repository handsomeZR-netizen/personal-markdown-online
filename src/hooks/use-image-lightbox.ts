/**
 * Hook for managing image lightbox state
 */

import { useState, useCallback, useEffect } from 'react';

export function useImageLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((imageUrls: string[], index: number = 0) => {
    setImages(imageUrls);
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Setup click handlers for images in the document
  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if clicked element is an image
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        
        // Get all images in the document
        const allImages = Array.from(
          document.querySelectorAll('img')
        ).map((img) => img.src);
        
        // Find the index of the clicked image
        const index = allImages.indexOf(img.src);
        
        if (index !== -1) {
          event.preventDefault();
          openLightbox(allImages, index);
        }
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleImageClick);

    return () => {
      document.removeEventListener('click', handleImageClick);
    };
  }, [openLightbox]);

  return {
    isOpen,
    images,
    currentIndex,
    openLightbox,
    closeLightbox,
  };
}
