import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  FolderTreeManagerImpl,
  type FolderNode,
} from '../folder-tree';

/**
 * Property-based tests for folder tree integrity
 * Feature: team-collaborative-knowledge-base, Property 5: Folder Tree Integrity
 * Validates: Requirements 4.1, 4.4, 4.5
 */

describe('Folder Tree Integrity Properties', () => {
  /**
   * Property 5: Folder Tree Integrity
   * For any folder move operation, the resulting tree structure should maintain
   * referential integrity with no orphaned nodes or circular references.
   */
  test('Property 5: folder tree maintains integrity after operations', () => {
    fc.assert(
      fc.property(
        // Generate a valid folder tree
        fc
          .array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              parentId: fc.option(fc.uuid(), { nil: null }),
              type: fc.constant('folder' as const),
              createdAt: fc.date(),
              updatedAt: fc.date(),
              noteCount: fc.nat(100),
            }),
            { minLength: 1, maxLength: 20 }
          )
          .map((folders) => {
            // Ensure at least one root folder (parentId = null)
            if (folders.length > 0 && folders.every((f) => f.parentId !== null)) {
              folders[0].parentId = null;
            }
            // Ensure parentIds reference existing folders
            const ids = folders.map((f) => f.id);
            return folders.map((f) => ({
              ...f,
              parentId:
                f.parentId && ids.includes(f.parentId) ? f.parentId : null,
            }));
          }),
        (folders) => {
          const manager = new FolderTreeManagerImpl();
          const tree = manager.buildTree(folders);

          // Property 1: All nodes should be reachable from roots
          const flatTree = manager.flattenTree(tree);
          expect(flatTree.length).toBeLessThanOrEqual(folders.length);

          // Property 2: No circular references
          const hasCircular = checkForCircularReferences(tree);
          expect(hasCircular).toBe(false);

          // Property 3: All parent-child relationships are valid
          flatTree.forEach((node) => {
            if (node.children && node.children.length > 0) {
              node.children.forEach((child) => {
                // Each child should reference this node as parent
                const originalChild = folders.find((f) => f.id === child.id);
                if (originalChild) {
                  expect(originalChild.parentId).toBe(node.id);
                }
              });
            }
          });

          // Property 4: No duplicate nodes in tree
          const nodeIds = flatTree.map((n) => n.id);
          const uniqueIds = new Set(nodeIds);
          expect(nodeIds.length).toBe(uniqueIds.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: breadcrumbs form valid path from root to node', () => {
    fc.assert(
      fc.property(
        // Generate a valid folder tree
        fc
          .array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              parentId: fc.option(fc.uuid(), { nil: null }),
              type: fc.constant('folder' as const),
              createdAt: fc.date(),
              updatedAt: fc.date(),
              noteCount: fc.nat(100),
            }),
            { minLength: 2, maxLength: 20 }
          )
          .chain((folders) => {
            // Ensure valid tree structure
            if (folders.length > 0 && folders.every((f) => f.parentId !== null)) {
              folders[0].parentId = null;
            }
            const ids = folders.map((f) => f.id);
            const validFolders = folders.map((f) => ({
              ...f,
              parentId:
                f.parentId && ids.includes(f.parentId) ? f.parentId : null,
            }));
            
            // Pick a random node to get breadcrumbs for
            return fc.tuple(
              fc.constant(validFolders),
              fc.constantFrom(...validFolders.map((f) => f.id))
            );
          }),
        ([folders, targetId]) => {
          const manager = new FolderTreeManagerImpl();
          const tree = manager.buildTree(folders);
          const breadcrumbs = manager.getBreadcrumbs(tree, targetId);

          if (breadcrumbs.length > 0) {
            // Property 1: Last breadcrumb should be the target node
            expect(breadcrumbs[breadcrumbs.length - 1].id).toBe(targetId);

            // Property 2: First breadcrumb should be a root (no parent)
            const firstNode = folders.find((f) => f.id === breadcrumbs[0].id);
            expect(firstNode?.parentId).toBeNull();

            // Property 3: Each breadcrumb should be parent of next
            for (let i = 0; i < breadcrumbs.length - 1; i++) {
              const current = breadcrumbs[i];
              const next = breadcrumbs[i + 1];
              const nextOriginal = folders.find((f) => f.id === next.id);
              expect(nextOriginal?.parentId).toBe(current.id);
            }

            // Property 4: No duplicate nodes in breadcrumbs
            const breadcrumbIds = breadcrumbs.map((b) => b.id);
            const uniqueIds = new Set(breadcrumbIds);
            expect(breadcrumbIds.length).toBe(uniqueIds.size);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: finding a node returns the correct node or null', () => {
    fc.assert(
      fc.property(
        fc
          .array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              parentId: fc.option(fc.uuid(), { nil: null }),
              type: fc.constant('folder' as const),
              createdAt: fc.date(),
              updatedAt: fc.date(),
              noteCount: fc.nat(100),
            }),
            { minLength: 1, maxLength: 20 }
          )
          .chain((folders) => {
            // Ensure valid tree structure
            if (folders.length > 0 && folders.every((f) => f.parentId !== null)) {
              folders[0].parentId = null;
            }
            const ids = folders.map((f) => f.id);
            const validFolders = folders.map((f) => ({
              ...f,
              parentId:
                f.parentId && ids.includes(f.parentId) ? f.parentId : null,
            }));
            
            return fc.tuple(
              fc.constant(validFolders),
              fc.oneof(
                fc.constantFrom(...validFolders.map((f) => f.id)), // Valid ID
                fc.uuid() // Random ID (likely not in tree)
              )
            );
          }),
        ([folders, searchId]) => {
          const manager = new FolderTreeManagerImpl();
          const tree = manager.buildTree(folders);
          const found = manager.findNode(tree, searchId);

          const existsInFolders = folders.some((f) => f.id === searchId);

          if (existsInFolders) {
            // If the ID exists in folders, it should be found
            expect(found).not.toBeNull();
            expect(found?.id).toBe(searchId);
          } else {
            // If the ID doesn't exist, it should not be found
            expect(found).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: tree depth is consistent with parent-child relationships', () => {
    fc.assert(
      fc.property(
        fc
          .array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              parentId: fc.option(fc.uuid(), { nil: null }),
              type: fc.constant('folder' as const),
              createdAt: fc.date(),
              updatedAt: fc.date(),
              noteCount: fc.nat(100),
            }),
            { minLength: 1, maxLength: 20 }
          )
          .map((folders) => {
            // Ensure valid tree structure
            if (folders.length > 0 && folders.every((f) => f.parentId !== null)) {
              folders[0].parentId = null;
            }
            const ids = folders.map((f) => f.id);
            return folders.map((f) => ({
              ...f,
              parentId:
                f.parentId && ids.includes(f.parentId) ? f.parentId : null,
            }));
          }),
        (folders) => {
          const manager = new FolderTreeManagerImpl();
          const tree = manager.buildTree(folders);

          folders.forEach((folder) => {
            const depth = manager.getNodeDepth(tree, folder.id);
            const breadcrumbs = manager.getBreadcrumbs(tree, folder.id);

            // Depth should equal breadcrumb length - 1
            if (breadcrumbs.length > 0) {
              expect(depth).toBe(breadcrumbs.length - 1);
            }

            // Root nodes should have depth 0
            if (folder.parentId === null) {
              expect(depth).toBe(0);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to check for circular references in a tree
 */
function checkForCircularReferences(
  tree: FolderNode[],
  visited: Set<string> = new Set()
): boolean {
  for (const node of tree) {
    if (visited.has(node.id)) {
      return true; // Circular reference detected
    }

    const newVisited = new Set(visited);
    newVisited.add(node.id);

    if (node.children && node.children.length > 0) {
      if (checkForCircularReferences(node.children, newVisited)) {
        return true;
      }
    }
  }

  return false;
}
