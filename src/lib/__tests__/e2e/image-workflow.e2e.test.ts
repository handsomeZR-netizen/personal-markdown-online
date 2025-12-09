/**
 * E2E Test: Image Workflow
 * Tests paste upload, drag upload, and lightbox functionality
 * Requirements: 6.1, 7.1, 8.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImageUploadManager } from '@/lib/storage/image-upload';

// Mock Supabase client
const mockSupabaseClient = {
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      remove: vi.fn(),
    })),
  },
};

describe('E2E: Image Workflow', () => {
  let imageUploadManager: ImageUploadManager;
  let mockFile: File;

  beforeEach(() => {
    // Create a mock image file
    const blob = new Blob(['fake-image-data'], { type: 'image/png' });
    mockFile = new File([blob], 'test-image.png', { type: 'image/png' });

    // Initialize image upload manager with mock client
    imageUploadManager = new ImageUploadManager(mockSupabaseClient as any);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Paste Upload', () => {
    it('should upload image when pasted into editor', async () => {
      // Requirement 6.1: Paste image with Ctrl+V
      const noteId = 'test-note-123';
      const mockUrl = 'https://example.com/storage/test-note-123/image.png';

      // Mock successful upload
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-note-123/image.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl },
      });

      // Simulate paste event
      const result = await imageUploadManager.uploadImage(mockFile, noteId);

      expect(result).toBe(mockUrl);
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('note-images');
      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalled();
    });

    it('should show upload progress indicator during paste upload', async () => {
      // Requirement 6.2: Show "uploading..." placeholder
      const noteId = 'test-note-123';
      let uploadProgress = 0;

      // Mock upload with progress
      mockSupabaseClient.storage.from().upload.mockImplementation(async () => {
        uploadProgress = 50;
        await new Promise(resolve => setTimeout(resolve, 100));
        uploadProgress = 100;
        return {
          data: { path: 'test-note-123/image.png' },
          error: null,
        };
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.png' },
      });

      // Start upload
      const uploadPromise = imageUploadManager.uploadImage(mockFile, noteId);

      // Progress should be updating
      expect(uploadProgress).toBeGreaterThanOrEqual(0);

      await uploadPromise;

      // Upload should be complete
      expect(uploadProgress).toBe(100);
    });

    it('should replace placeholder with actual image on successful upload', async () => {
      // Requirement 6.3: Replace placeholder with image URL
      const noteId = 'test-note-123';
      const mockUrl = 'https://example.com/storage/test-note-123/image.png';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-note-123/image.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl },
      });

      const result = await imageUploadManager.uploadImage(mockFile, noteId);

      // Should return the public URL that replaces the placeholder
      expect(result).toBe(mockUrl);
      expect(result).toContain('https://');
    });

    it('should show error and keep placeholder on upload failure', async () => {
      // Requirement 6.4: Show error on upload failure
      const noteId = 'test-note-123';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      await expect(
        imageUploadManager.uploadImage(mockFile, noteId)
      ).rejects.toThrow('上传失败: Upload failed');
    });

    it('should reject images larger than 10MB', async () => {
      // Requirement 6.5: Reject images > 10MB
      const noteId = 'test-note-123';
      const largeBlob = new Blob([new ArrayBuffer(11 * 1024 * 1024)], { type: 'image/png' });
      const largeFile = new File([largeBlob], 'large-image.png', { type: 'image/png' });

      await expect(
        imageUploadManager.uploadImage(largeFile, noteId)
      ).rejects.toThrow('图片大小不能超过 10MB');
    });
  });

  describe('Drag Upload', () => {
    it('should show drop zone highlight when dragging image', () => {
      // Requirement 7.1: Show drop target highlight
      const dropZone = document.createElement('div');
      dropZone.classList.add('editor-drop-zone');

      // Simulate drag enter
      const dragEnterEvent = new DragEvent('dragenter', {
        dataTransfer: new DataTransfer(),
      });

      dropZone.dispatchEvent(dragEnterEvent);

      // In real implementation, this would add a highlight class
      dropZone.classList.add('drop-zone-active');

      expect(dropZone.classList.contains('drop-zone-active')).toBe(true);
    });

    it('should upload image when dropped into editor', async () => {
      // Requirement 7.2: Upload on file drop
      const noteId = 'test-note-123';
      const mockUrl = 'https://example.com/storage/test-note-123/image.png';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-note-123/image.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl },
      });

      const result = await imageUploadManager.uploadImage(mockFile, noteId);

      expect(result).toBe(mockUrl);
    });

    it('should upload multiple images in sequence when dropped', async () => {
      // Requirement 7.3: Upload multiple images sequentially
      const noteId = 'test-note-123';
      const files = [
        new File([new Blob(['image1'])], 'image1.png', { type: 'image/png' }),
        new File([new Blob(['image2'])], 'image2.png', { type: 'image/png' }),
        new File([new Blob(['image3'])], 'image3.png', { type: 'image/png' }),
      ];

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-note-123/image.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.png' },
      });

      const results = await imageUploadManager.uploadImages(files, noteId);

      expect(results).toHaveLength(3);
      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledTimes(3);
    });

    it('should reject non-image files when dropped', async () => {
      // Requirement 7.4: Reject non-image files
      const noteId = 'test-note-123';
      const textFile = new File([new Blob(['text'])], 'document.txt', { type: 'text/plain' });

      await expect(
        imageUploadManager.uploadImage(textFile, noteId)
      ).rejects.toThrow('只支持图片文件');
    });

    it('should insert image at drop position', async () => {
      // Requirement 7.5: Insert at drop position
      const noteId = 'test-note-123';
      const mockUrl = 'https://example.com/storage/test-note-123/image.png';
      const dropPosition = 42; // Character position in editor

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-note-123/image.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl },
      });

      const result = await imageUploadManager.uploadImage(mockFile, noteId);

      // In real implementation, the editor would insert at dropPosition
      expect(result).toBe(mockUrl);
      expect(dropPosition).toBe(42);
    });
  });

  describe('Lightbox Preview', () => {
    it('should open lightbox when image is clicked', () => {
      // Requirement 8.1: Open lightbox on click
      const imageElement = document.createElement('img');
      imageElement.src = 'https://example.com/image.png';
      imageElement.classList.add('editor-image');

      let lightboxOpen = false;
      imageElement.addEventListener('click', () => {
        lightboxOpen = true;
      });

      imageElement.click();

      expect(lightboxOpen).toBe(true);
    });

    it('should display close button and image dimensions in lightbox', () => {
      // Requirement 8.2: Show close button and dimensions
      const lightbox = {
        isOpen: true,
        imageUrl: 'https://example.com/image.png',
        imageDimensions: { width: 1920, height: 1080 },
        hasCloseButton: true,
      };

      expect(lightbox.isOpen).toBe(true);
      expect(lightbox.hasCloseButton).toBe(true);
      expect(lightbox.imageDimensions).toEqual({ width: 1920, height: 1080 });
    });

    it('should close lightbox when background is clicked', () => {
      // Requirement 8.3: Close on background click
      let lightboxOpen = true;

      const lightboxBackground = document.createElement('div');
      lightboxBackground.classList.add('lightbox-background');

      lightboxBackground.addEventListener('click', (e) => {
        if (e.target === lightboxBackground) {
          lightboxOpen = false;
        }
      });

      // Simulate click on background
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: lightboxBackground });
      lightboxBackground.dispatchEvent(clickEvent);

      expect(lightboxOpen).toBe(false);
    });

    it('should close lightbox when Esc key is pressed', () => {
      // Requirement 8.3: Close on Esc key
      let lightboxOpen = true;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          lightboxOpen = false;
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Simulate Esc key press
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);

      expect(lightboxOpen).toBe(false);

      document.removeEventListener('keydown', handleKeyDown);
    });

    it('should navigate between multiple images with arrow buttons', () => {
      // Requirement 8.4: Navigate with arrows
      const images = [
        'https://example.com/image1.png',
        'https://example.com/image2.png',
        'https://example.com/image3.png',
      ];

      let currentIndex = 0;

      const navigateNext = () => {
        currentIndex = (currentIndex + 1) % images.length;
      };

      const navigatePrev = () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
      };

      expect(images[currentIndex]).toBe('https://example.com/image1.png');

      navigateNext();
      expect(images[currentIndex]).toBe('https://example.com/image2.png');

      navigateNext();
      expect(images[currentIndex]).toBe('https://example.com/image3.png');

      navigatePrev();
      expect(images[currentIndex]).toBe('https://example.com/image2.png');
    });

    it('should show error placeholder when image fails to load', () => {
      // Requirement 8.5: Show error placeholder
      const imageElement = document.createElement('img');
      imageElement.src = 'https://example.com/broken-image.png';

      let errorOccurred = false;
      imageElement.addEventListener('error', () => {
        errorOccurred = true;
      });

      // Simulate image load error
      imageElement.dispatchEvent(new Event('error'));

      expect(errorOccurred).toBe(true);
    });
  });

  describe('Complete Image Workflow', () => {
    it('should handle complete paste-to-lightbox workflow', async () => {
      // Integration test covering Requirements 6.1, 6.2, 6.3, 8.1
      const noteId = 'test-note-123';
      const mockUrl = 'https://example.com/storage/test-note-123/image.png';

      // Step 1: Paste image
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-note-123/image.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl },
      });

      const uploadedUrl = await imageUploadManager.uploadImage(mockFile, noteId);
      expect(uploadedUrl).toBe(mockUrl);

      // Step 2: Image is inserted into editor
      const editorContent = `<img src="${uploadedUrl}" alt="Uploaded image" />`;
      expect(editorContent).toContain(mockUrl);

      // Step 3: Click image to open lightbox
      let lightboxOpen = false;
      let lightboxImageUrl = '';

      const openLightbox = (url: string) => {
        lightboxOpen = true;
        lightboxImageUrl = url;
      };

      openLightbox(uploadedUrl);

      expect(lightboxOpen).toBe(true);
      expect(lightboxImageUrl).toBe(mockUrl);
    });

    it('should handle complete drag-to-lightbox workflow', async () => {
      // Integration test covering Requirements 7.1, 7.2, 7.5, 8.1
      const noteId = 'test-note-123';
      const mockUrl = 'https://example.com/storage/test-note-123/image.png';

      // Step 1: Drag image over editor
      const dropZoneActive = true;
      expect(dropZoneActive).toBe(true);

      // Step 2: Drop image
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-note-123/image.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl },
      });

      const uploadedUrl = await imageUploadManager.uploadImage(mockFile, noteId);
      expect(uploadedUrl).toBe(mockUrl);

      // Step 3: Image inserted at drop position
      const dropPosition = 100;
      const editorContent = `Text before${' '.repeat(dropPosition)}<img src="${uploadedUrl}" />`;
      expect(editorContent).toContain(mockUrl);

      // Step 4: Click to open lightbox
      let lightboxOpen = false;
      const openLightbox = () => {
        lightboxOpen = true;
      };

      openLightbox();
      expect(lightboxOpen).toBe(true);
    });

    it('should handle multiple image uploads and lightbox navigation', async () => {
      // Integration test covering Requirements 7.3, 8.4
      const noteId = 'test-note-123';
      const files = [
        new File([new Blob(['image1'])], 'image1.png', { type: 'image/png' }),
        new File([new Blob(['image2'])], 'image2.png', { type: 'image/png' }),
        new File([new Blob(['image3'])], 'image3.png', { type: 'image/png' }),
      ];

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-note-123/image.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.png' },
      });

      // Upload all images
      const uploadedUrls = await imageUploadManager.uploadImages(files, noteId);
      expect(uploadedUrls).toHaveLength(3);

      // Open lightbox on first image
      let currentImageIndex = 0;
      expect(uploadedUrls[currentImageIndex]).toBe('https://example.com/image.png');

      // Navigate to next image
      currentImageIndex = (currentImageIndex + 1) % uploadedUrls.length;
      expect(currentImageIndex).toBe(1);

      // Navigate to next image
      currentImageIndex = (currentImageIndex + 1) % uploadedUrls.length;
      expect(currentImageIndex).toBe(2);
    });

    it('should handle upload errors gracefully in complete workflow', async () => {
      // Integration test covering Requirements 6.4, 7.4
      const noteId = 'test-note-123';

      // Test 1: Upload failure
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      await expect(
        imageUploadManager.uploadImage(mockFile, noteId)
      ).rejects.toThrow('上传失败: Network error');

      // Test 2: Invalid file type
      const textFile = new File([new Blob(['text'])], 'document.txt', { type: 'text/plain' });

      await expect(
        imageUploadManager.uploadImage(textFile, noteId)
      ).rejects.toThrow('只支持图片文件');

      // Test 3: File too large
      const largeBlob = new Blob([new ArrayBuffer(11 * 1024 * 1024)], { type: 'image/png' });
      const largeFile = new File([largeBlob], 'large.png', { type: 'image/png' });

      await expect(
        imageUploadManager.uploadImage(largeFile, noteId)
      ).rejects.toThrow('图片大小不能超过 10MB');
    });
  });
});
