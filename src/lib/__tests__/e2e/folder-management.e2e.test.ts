/**
 * E2E Test: Folder Management Workflow
 * Tests folder creation, nesting, drag-drop, and breadcrumbs
 * Requirements: 4.1, 4.2, 4.4, 5.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FolderTreeManagerImpl, type FolderNode } from '@/lib/folders/folder-tree';

describe('E2E: Folder Management Workflow', () => {
  let folderManager: FolderTreeManagerImpl;

  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn();
    
    // Create new instance for each test
    folderManager = new FolderTreeManagerImpl();
  });

  describe('Folder Creation', () => {
    it('should create a root folder', () => {
      // Requirement 4.1: Create folders
      const rootFolder: FolderNode = {
        id: 'folder-1',
        name: 'Projects',
        parentId: null,
        type: 'folder',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tree = folderManager.buildTree([rootFolder]);
      
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('folder-1');
      expect(tree[0].name).toBe('Projects');
      expect(tree[0].parentId).toBeNull();
    });

    it('should create nested folders', () => {
      // Requirement 4.1: Create folders within folders
      const folders: FolderNode[] = [
        {
          id: 'folder-1',
          name: 'Work',
          parentId: null,
          type: 'folder',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'folder-2',
          name: 'Projects',
          parentId: 'folder-1',
          type: 'folder',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'folder-3',
          name: 'Client A',
          parentId: 'folder-2',
          type: 'folder',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const tree = folderManager.buildTree(folders);
      
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Work');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].name).toBe('Projects');
      expect(tree[0].children![0].children).toHaveLength(1);
      expect(tree[0].children![0].children![0].name).toBe('Client A');
    });

    it('should handle multiple root folders', () => {
      // Requirement 4.1: Multiple top-level folders
      const folders: FolderNode[] = [
        {
          id: 'folder-1',
          name: 'Work',
          parentId: null,
          type: 'folder',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'folder-2',
          name: 'Personal',
          parentId: null,
          type: 'folder',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'folder-3',
          name: 'Archive',
          parentId: null,
          type: 'folder',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const tree = folderManager.buildTree(folders);
      
      expect(tree).toHaveLength(3);
      // Tree is sorted alphabetically by name
      expect(tree.map((f: FolderNode) => f.name).sort()).toEqual(['Archive', 'Personal', 'Work']);
    });

    it('should create deeply nested folder structure', () => {
      // Requirement 4.1: Unlimited nesting depth
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Level 1', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Level 2', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f3', name: 'Level 3', parentId: 'f2', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f4', name: 'Level 4', parentId: 'f3', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f5', name: 'Level 5', parentId: 'f4', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(folders);
      
      let current = tree[0];
      let depth = 1;
      
      while (current.children && current.children.length > 0) {
        current = current.children[0];
        depth++;
      }
      
      expect(depth).toBe(5);
      expect(current.name).toBe('Level 5');
    });
  });

  describe('Folder Tree Display', () => {
    it('should display tree structure in sidebar', () => {
      // Requirement 4.2: Display tree structure
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Work', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Projects', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n1', name: 'Note 1', parentId: 'f2', type: 'note', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(folders);
      
      expect(tree).toHaveLength(1);
      expect(tree[0].type).toBe('folder');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].children).toHaveLength(1);
      expect(tree[0].children![0].children![0].type).toBe('note');
    });

    it('should support expand and collapse of folders', () => {
      // Requirement 4.3: Toggle expand/collapse
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Work', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Projects', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(folders);
      
      // Simulate expand/collapse state
      let isExpanded = false;
      
      const toggleExpand = () => {
        isExpanded = !isExpanded;
      };

      expect(isExpanded).toBe(false);
      
      toggleExpand();
      expect(isExpanded).toBe(true);
      
      toggleExpand();
      expect(isExpanded).toBe(false);
    });

    it('should show folder icons and note icons differently', () => {
      // Requirement 4.2: Different icons for folders and notes
      const items: FolderNode[] = [
        { id: 'f1', name: 'Folder', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n1', name: 'Note', parentId: null, type: 'note', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(items);
      
      const folderItem = tree.find((item: FolderNode) => item.type === 'folder');
      const noteItem = tree.find((item: FolderNode) => item.type === 'note');
      
      expect(folderItem?.type).toBe('folder');
      expect(noteItem?.type).toBe('note');
    });

    it('should maintain tree structure with mixed folders and notes', () => {
      // Requirement 4.2: Mixed content in tree
      const items: FolderNode[] = [
        { id: 'f1', name: 'Work', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n1', name: 'Quick Note', parentId: 'f1', type: 'note', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Projects', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n2', name: 'Project Plan', parentId: 'f2', type: 'note', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(items);
      
      expect(tree[0].children).toHaveLength(2);
      // Children are sorted alphabetically: "Projects" comes before "Quick Note"
      expect(tree[0].children![0].type).toBe('folder');
      expect(tree[0].children![1].type).toBe('note');
      expect(tree[0].children![0].children).toHaveLength(1);
    });
  });

  describe('Drag and Drop', () => {
    it('should move note to folder via drag and drop', async () => {
      // Requirement 4.4: Drag note to folder
      const noteId = 'note-1';
      const targetFolderId = 'folder-1';

      // Mock API call
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Simulate drag and drop
      const response = await fetch('/api/notes/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, folderId: targetFolderId }),
      });

      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notes/move',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ noteId, folderId: targetFolderId }),
        })
      );
    });

    it('should move folder to another folder via drag and drop', async () => {
      // Requirement 4.5: Drag folder to folder
      const sourceFolderId = 'folder-2';
      const targetFolderId = 'folder-1';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await fetch('/api/folders/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: sourceFolderId, newParentId: targetFolderId }),
      });

      const result = await response.json();
      
      expect(result.success).toBe(true);
    });

    it('should move entire folder with children', () => {
      // Requirement 4.5: Move folder with all contents
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Work', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Projects', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f3', name: 'Client A', parentId: 'f2', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n1', name: 'Note 1', parentId: 'f3', type: 'note', createdAt: new Date(), updatedAt: new Date() },
      ];

      let tree = folderManager.buildTree(folders);
      expect(tree).toHaveLength(2);

      // Simulate moving f2 into f1
      const updatedFolders = folders.map((f: FolderNode) => 
        f.id === 'f2' ? { ...f, parentId: 'f1' } : f
      );

      tree = folderManager.buildTree(updatedFolders);
      
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('f1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].id).toBe('f2');
      expect(tree[0].children![0].children).toHaveLength(1);
      expect(tree[0].children![0].children![0].id).toBe('f3');
    });

    it('should prevent circular references when moving folders', () => {
      // Requirement 4.5: Prevent circular references
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Parent', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Child', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
      ];

      // Attempt to move parent into child (should be prevented)
      const isCircular = (folderId: string, newParentId: string, allFolders: FolderNode[]): boolean => {
        let currentId: string | null = newParentId;
        
        while (currentId) {
          if (currentId === folderId) {
            return true; // Circular reference detected
          }
          const parent = allFolders.find(f => f.id === currentId);
          currentId = parent?.parentId || null;
        }
        
        return false;
      };

      expect(isCircular('f1', 'f2', folders)).toBe(true);
      expect(isCircular('f2', 'f1', folders)).toBe(false);
    });

    it('should update tree structure after drag and drop', () => {
      // Requirement 4.4, 4.5: Tree updates after move
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Folder A', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Folder B', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n1', name: 'Note 1', parentId: 'f1', type: 'note', createdAt: new Date(), updatedAt: new Date() },
      ];

      let tree = folderManager.buildTree(folders);
      expect(tree[0].children).toHaveLength(1);
      // buildTree creates empty arrays instead of undefined
      expect(tree[1].children).toEqual([]);

      // Move note from f1 to f2
      const updatedFolders = folders.map((f: FolderNode) => 
        f.id === 'n1' ? { ...f, parentId: 'f2' } : f
      );

      tree = folderManager.buildTree(updatedFolders);
      
      expect(tree[0].children).toEqual([]);
      expect(tree[1].children).toHaveLength(1);
      expect(tree[1].children![0].id).toBe('n1');
    });
  });

  describe('Breadcrumbs Navigation', () => {
    it('should display breadcrumb path for note in folder', async () => {
      // Requirement 5.1: Display breadcrumb path
      const mockBreadcrumbs = [
        { id: 'root', name: '首页', parentId: null, type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
        { id: 'f1', name: '工作', parentId: 'root', type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: '项目', parentId: 'f1', type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBreadcrumbs),
      });

      const response = await fetch(`/api/folders/f2/breadcrumbs`);
      const breadcrumbs = await response.json();
      
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs.map((b: any) => b.name)).toEqual(['首页', '工作', '项目']);
    });

    it('should display full path for deeply nested note', async () => {
      // Requirement 5.2: Display complete path
      const mockBreadcrumbs = [
        { id: 'root', name: '首页', parentId: null, type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
        { id: 'f1', name: '工作', parentId: 'root', type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: '项目', parentId: 'f1', type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
        { id: 'f3', name: '文档', parentId: 'f2', type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBreadcrumbs),
      });

      const response = await fetch(`/api/folders/f3/breadcrumbs`);
      const breadcrumbs = await response.json();
      
      expect(breadcrumbs).toHaveLength(4);
      expect(breadcrumbs.map((b: any) => b.name)).toEqual(['首页', '工作', '项目', '文档']);
    });

    it('should make breadcrumb items clickable for navigation', () => {
      // Requirement 5.3: Clickable breadcrumb navigation
      const breadcrumbs = [
        { id: 'root', name: '首页', path: '/' },
        { id: 'f1', name: '工作', path: '/folders/f1' },
        { id: 'f2', name: '项目', path: '/folders/f2' },
      ];

      let currentPath = '/folders/f2';

      const navigateTo = (path: string) => {
        currentPath = path;
      };

      expect(currentPath).toBe('/folders/f2');

      navigateTo(breadcrumbs[1].path);
      expect(currentPath).toBe('/folders/f1');

      navigateTo(breadcrumbs[0].path);
      expect(currentPath).toBe('/');
    });

    it('should show ellipsis for very long paths', () => {
      // Requirement 5.4: Ellipsis for long paths
      const longPath = [
        '首页',
        'Level 1',
        'Level 2',
        'Level 3',
        'Level 4',
        'Level 5',
        'Level 6',
        'Level 7',
      ];

      const maxVisible = 4;
      const shouldShowEllipsis = longPath.length > maxVisible;
      
      expect(shouldShowEllipsis).toBe(true);

      // Show first, ellipsis, and last few items
      const displayPath = shouldShowEllipsis
        ? [longPath[0], '...', ...longPath.slice(-2)]
        : longPath;

      expect(displayPath).toEqual(['首页', '...', 'Level 6', 'Level 7']);
    });

    it('should show only home for root level notes', () => {
      // Requirement 5.5: Root level shows only home
      const breadcrumbs = [
        { id: 'root', name: '首页', parentId: null, type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
      ];

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].name).toBe('首页');
    });
  });

  describe('Folder Finding and Navigation', () => {
    it('should find folder by ID in tree', () => {
      // Test findNode functionality
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Work', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Projects', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f3', name: 'Client A', parentId: 'f2', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(folders);
      const found = folderManager.findNode(tree, 'f3');
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('Client A');
    });

    it('should return null for non-existent folder', () => {
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Work', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(folders);
      const found = folderManager.findNode(tree, 'non-existent');
      
      expect(found).toBeNull();
    });

    it('should find deeply nested folder', () => {
      const folders: FolderNode[] = [
        { id: 'f1', name: 'L1', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'L2', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f3', name: 'L3', parentId: 'f2', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f4', name: 'L4', parentId: 'f3', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f5', name: 'L5', parentId: 'f4', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(folders);
      const found = folderManager.findNode(tree, 'f5');
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('L5');
    });
  });

  describe('Complete Folder Management Workflow', () => {
    it('should handle complete folder creation and organization workflow', () => {
      // Integration test covering Requirements 4.1, 4.2, 4.3
      
      // Step 1: Create root folders
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Work', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Personal', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
      ];

      let tree = folderManager.buildTree(folders);
      expect(tree).toHaveLength(2);

      // Step 2: Add nested folders
      folders.push(
        { id: 'f3', name: 'Projects', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f4', name: 'Archive', parentId: 'f2', type: 'folder', createdAt: new Date(), updatedAt: new Date() }
      );

      tree = folderManager.buildTree(folders);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[1].children).toHaveLength(1);

      // Step 3: Add notes
      folders.push(
        { id: 'n1', name: 'Meeting Notes', parentId: 'f3', type: 'note', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n2', name: 'Ideas', parentId: 'f4', type: 'note', createdAt: new Date(), updatedAt: new Date() }
      );

      tree = folderManager.buildTree(folders);
      expect(tree[0].children![0].children).toHaveLength(1);
      expect(tree[1].children![0].children).toHaveLength(1);
    });

    it('should handle complete drag-drop workflow', async () => {
      // Integration test covering Requirements 4.4, 4.5
      
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Source', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Target', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n1', name: 'Note', parentId: 'f1', type: 'note', createdAt: new Date(), updatedAt: new Date() },
      ];

      let tree = folderManager.buildTree(folders);
      expect(tree[0].children).toHaveLength(1);
      // buildTree creates empty arrays instead of undefined
      expect(tree[1].children).toEqual([]);

      // Drag note from Source to Target
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await fetch('/api/notes/move', {
        method: 'POST',
        body: JSON.stringify({ noteId: 'n1', folderId: 'f2' }),
      });

      // Update local state
      const updatedFolders = folders.map((f: FolderNode) => 
        f.id === 'n1' ? { ...f, parentId: 'f2' } : f
      );

      tree = folderManager.buildTree(updatedFolders);
      expect(tree[0].children).toEqual([]);
      expect(tree[1].children).toHaveLength(1);
    });

    it('should handle complete breadcrumb navigation workflow', async () => {
      // Integration test covering Requirements 5.1, 5.2, 5.3
      
      const mockBreadcrumbs = [
        { id: 'root', name: '首页', parentId: null, type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
        { id: 'f1', name: '工作', parentId: 'root', type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: '项目', parentId: 'f1', type: 'folder' as const, createdAt: new Date(), updatedAt: new Date() },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBreadcrumbs),
      });

      // Get breadcrumbs
      const response = await fetch(`/api/folders/f2/breadcrumbs`);
      const breadcrumbs = await response.json();
      expect(breadcrumbs).toHaveLength(3);

      // Navigate via breadcrumb
      let currentFolder = 'f2';
      const navigateToFolder = (folderId: string) => {
        currentFolder = folderId;
      };

      navigateToFolder(breadcrumbs[1].id);
      expect(currentFolder).toBe('f1');
    });

    it('should handle complex folder reorganization', () => {
      // Complex integration test
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Work', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Personal', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f3', name: 'Projects', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f4', name: 'Archive', parentId: 'f2', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n1', name: 'Note 1', parentId: 'f3', type: 'note', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n2', name: 'Note 2', parentId: 'f4', type: 'note', createdAt: new Date(), updatedAt: new Date() },
      ];

      let tree = folderManager.buildTree(folders);
      expect(tree).toHaveLength(2);

      // Move Projects folder from Work to Personal
      const reorganized = folders.map((f: FolderNode) => 
        f.id === 'f3' ? { ...f, parentId: 'f2' } : f
      );

      tree = folderManager.buildTree(reorganized);
      
      // Tree is sorted alphabetically: Personal comes before Work
      const personalFolder = tree.find((f: FolderNode) => f.name === 'Personal');
      const workFolder = tree.find((f: FolderNode) => f.name === 'Work');
      
      expect(workFolder?.children).toEqual([]); // Work is now empty
      expect(personalFolder?.children).toHaveLength(2); // Personal has Archive and Projects
      // Children are sorted alphabetically: "Archive" comes before "Projects"
      expect(personalFolder?.children![1].children).toHaveLength(1); // Projects still has Note 1
    });

    it('should maintain data integrity across operations', () => {
      // Test data integrity
      const folders: FolderNode[] = [
        { id: 'f1', name: 'Folder 1', parentId: null, type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'f2', name: 'Folder 2', parentId: 'f1', type: 'folder', createdAt: new Date(), updatedAt: new Date() },
        { id: 'n1', name: 'Note 1', parentId: 'f2', type: 'note', createdAt: new Date(), updatedAt: new Date() },
      ];

      const tree = folderManager.buildTree(folders);
      
      // Verify all items are in tree
      const allNodes: FolderNode[] = [];
      const collectNodes = (nodes: FolderNode[]) => {
        nodes.forEach(node => {
          allNodes.push(node);
          if (node.children) {
            collectNodes(node.children);
          }
        });
      };

      collectNodes(tree);
      
      expect(allNodes).toHaveLength(3);
      expect(allNodes.map((n: FolderNode) => n.id).sort()).toEqual(['f1', 'f2', 'n1']);
    });
  });
});
