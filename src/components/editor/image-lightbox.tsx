"use client";

/**
 * Image Lightbox Component
 * Displays images in fullscreen mode with navigation
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset state when opening with new image
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setImageError(false);
      setImageLoaded(false);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setImageError(false);
            setImageLoaded(false);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setImageError(false);
            setImageLoaded(false);
          }
          break;
      }
    },
    [isOpen, currentIndex, images.length, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="关闭"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 text-white bg-black/50 px-3 py-1 rounded-md">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Previous button */}
      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex(currentIndex - 1);
            setImageError(false);
            setImageLoaded(false);
          }}
          aria-label="上一张"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Next button */}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex(currentIndex + 1);
            setImageError(false);
            setImageLoaded(false);
          }}
          aria-label="下一张"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {imageError ? (
          <div className="flex flex-col items-center gap-4 text-white">
            <AlertCircle className="h-16 w-16" />
            <p className="text-lg">图片加载失败</p>
            <p className="text-sm text-white/70">无法加载图片，请检查图片链接</p>
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
              </div>
            )}
            <img
              src={currentImage}
              alt={`图片 ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain rounded-lg ${
                imageLoaded ? 'block' : 'hidden'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        )}
      </div>

      {/* Image info */}
      {!imageError && imageLoaded && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-md text-sm">
          点击背景或按 ESC 键关闭
          {images.length > 1 && ' | 使用方向键切换图片'}
        </div>
      )}
    </div>
  );
}
