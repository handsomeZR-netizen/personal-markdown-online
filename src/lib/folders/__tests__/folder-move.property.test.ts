import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-based tests for folder drag-drop consistency
 * Feature: team-collaborative-knowledge-base, Property 20: Folder Drag-Drop Consistency
 * Validates: Requirements 4.4, 4.5
 */

/**
 * Helper function to check for circular references
 */
function checkCircularReference(
  folderId: string,
  newParentId: string,
  folderMap: Map<string, { id: string; parentId: string | null }>
): boolean {
  let currentId: string | null = newParentId;

  while (currentId) {
    if (currentId === folderId) {
      return true; // Circular reference detected
    }

    const folder = folderMap.get(currentId);
    currentId = folder?.parentId || null;
  }

  return false;
}

/**
 * Simulate a folder move operation
 */
function simulateFolderMove(
  folderId: string,
  newParentId: string | null,
  folderMap: Map<string, { id: string; parentId: string | null }>
): { success: boolean; error?: string } {
  const folder = folderMap.get(folderId);
  if (!folder) {
    return { success: false, error: 'Folder not found' };
  }

  // Store original state
  const originalParentId = folder.parentId;

  // Prevent moving folder into itself
  if (newParentId === folderId) {
    return { success: false, error: 'Cannot move folder into itself' };
  }

  // Check for circular reference
  if (newParentId) {
    const wouldCreateCircle = checkCircularReference(
      folderId,
      newParentId,
      folderMap
    );
    if (wouldCreateCircle) {
      return { success: false, error: 'Would create circular reference' };
    }
  }

  // Perform the move
  folder.parentId = newParentId;
  return { success: true };
}

describe('Folder Drag-Drop Consistency Properties', () => {
  /**
   * Property 20: Folder Drag-Drop Consistency
   * For any drag-and-drop operation moving a folder, the operation should either
   * complete successfully with the folder in the new location, or fail completely
   * with the folder remaining in the original location.
   */
  test('Property 20: folder move is atomic - success or complete rollback', () => {
    fc.assert(
      fc.property(
        // Generate a folder structure with unique IDs
        fc
          .uniqueArray(fc.uuid(), { minLength: 2, maxLength: 10 })
          .chain((ids) => {
            // Create folders with these unique IDs
            const folders = ids.map((id, index) => ({
              id,
              parentId:
                index > 0 && Math.random() > 0.5
                  ? ids[Math.floor(Math.random() * index)]
                  : null,
            }));

            // Ensure at least one root
            folders[0].parentId = null;

            // Pick a folder to move and a target parent
            return fc.tuple(
              fc.constant(folders),
              fc.constantFrom(...folders.map((f) => f.id)),
              fc.option(fc.constantFrom(...folders.map((f) => f.id)), {
                nil: null,
              })
            );
          }),
        ([folders, folderId, newParentId]) => {
          // Create folder map with deep copy to preserve original state
          const folderMap = new Map(
            folders.map((f) => [f.id, { ...f }])
          );

          // Store original state BEFORE the move
          const originalParentId = folderMap.get(folderId)?.parentId;

          // Attempt move
          const result = simulateFolderMove(folderId, newParentId, folderMap);

          const finalParentId = folderMap.get(folderId)?.parentId;

          if (result.success) {
            // If successful, folder MUST be in new location
            expect(finalParentId).toBe(newParentId);
          } else {
            // If failed, folder MUST remain in original location (unchanged)
            expect(finalParentId).toBe(originalParentId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 20: moving folder into itself always fails', () => {
    fc.assert(
      fc.property(fc.uuid(), (folderId) => {
        const folderMap = new Map([
          [folderId, { id: folderId, parentId: null }],
        ]);

        const result = simulateFolderMove(folderId, folderId, folderMap);

        // Should always fail
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  test('Property 20: moving folder into descendant always fails', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.uuid(), { minLength: 3, maxLength: 5 }),
        (ids) => {
          // Create a chain: ids[0] -> ids[1] -> ids[2] -> ...
          const folders = ids.map((id, index) => ({
            id,
            parentId: index > 0 ? ids[index - 1] : null,
          }));

          const folderMap = new Map(folders.map((f) => [f.id, { ...f }]));

          // Try to move root into any descendant
          const rootId = ids[0];
          const descendantId = ids[ids.length - 1];

          const result = simulateFolderMove(rootId, descendantId, folderMap);

          // Should always fail
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 20: valid moves between unrelated folders succeed', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.uuid(), { minLength: 3, maxLength: 6 }),
        (ids) => {
          // Create simple flat structure - all folders at root level
          const folders = ids.map((id) => ({
            id,
            parentId: null as string | null,
          }));

          const folderMap = new Map(folders.map((f) => [f.id, { ...f }]));

          // Pick two different folders
          const folderId = ids[0];
          const targetId = ids[1];

          const result = simulateFolderMove(folderId, targetId, folderMap);

          // Should succeed since they're unrelated
          expect(result.success).toBe(true);
          expect(folderMap.get(folderId)?.parentId).toBe(targetId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 20: moving to null (root) always succeeds for non-root folders', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.uuid(), { minLength: 2, maxLength: 10 }),
        (ids) => {
          // Create folders where at least one is NOT at root
          const folders = ids.map((id, index) => ({
            id,
            parentId: index > 0 ? ids[0] : null, // All except first are children of first
          }));

          const folderMap = new Map(folders.map((f) => [f.id, { ...f }]));

          // Pick a non-root folder
          const folderId = ids[1]; // This has parentId = ids[0]

          const result = simulateFolderMove(folderId, null, folderMap);

          // Should always succeed
          expect(result.success).toBe(true);
          expect(folderMap.get(folderId)?.parentId).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 20: move operation does not affect other folders', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.uuid(), { minLength: 4, maxLength: 8 }),
        (ids) => {
          // Create flat structure
          const folders = ids.map((id) => ({
            id,
            parentId: null as string | null,
          }));

          const folderMap = new Map(folders.map((f) => [f.id, { ...f }]));

          // Store state of all OTHER folders
          const otherFolders = ids.slice(2).map((id) => ({
            id,
            parentId: folderMap.get(id)?.parentId,
          }));

          // Move first folder to second
          simulateFolderMove(ids[0], ids[1], folderMap);

          // Verify other folders unchanged
          otherFolders.forEach(({ id, parentId }) => {
            expect(folderMap.get(id)?.parentId).toBe(parentId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
