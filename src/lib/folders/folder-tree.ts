/**
 * Folder Tree Manager
 * Manages hierarchical folder structure operations
 * Validates: Requirements 4.2, 5.1, 5.2
 */

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  type: 'folder' | 'note';
  children?: FolderNode[];
  createdAt: Date;
  updatedAt: Date;
  noteCount?: number;
  isExpanded?: boolean;
}

export interface FolderTreeManager {
  buildTree(items: FolderNode[]): FolderNode[];
  findNode(tree: FolderNode[], nodeId: string): FolderNode | null;
  getBreadcrumbs(tree: FolderNode[], nodeId: string): FolderNode[];
  toggleExpanded(nodeId: string): void;
  isExpanded(nodeId: string): boolean;
}

export class FolderTreeManagerImpl implements FolderTreeManager {
  private expandedIds: Set<string>;

  constructor() {
    this.expandedIds = new Set();
  }

  /**
   * Build a tree structure from a flat list of folders
   * Validates: Requirement 4.2
   */
  public buildTree(items: FolderNode[]): FolderNode[] {
    const map = new Map<string, FolderNode>();
    const roots: FolderNode[] = [];

    // Create a map of all items
    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    // Build the tree by connecting parents and children
    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId === null) {
        roots.push(node);
      } else {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          // If parent not found, treat as root (orphaned node)
          roots.push(node);
        }
      }
    });

    // Sort children by name
    const sortChildren = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortChildren(node.children);
        }
      });
    };

    sortChildren(roots);

    return roots;
  }

  /**
   * Find a specific node in the tree
   * Validates: Requirement 4.2
   */
  public findNode(tree: FolderNode[], nodeId: string): FolderNode | null {
    for (const node of tree) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findNode(node.children, nodeId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Get breadcrumb path from root to a specific node
   * Validates: Requirements 5.1, 5.2
   */
  public getBreadcrumbs(tree: FolderNode[], nodeId: string): FolderNode[] {
    const path: FolderNode[] = [];

    const findPath = (nodes: FolderNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          path.push(node);
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, targetId)) {
            path.unshift(node);
            return true;
          }
        }
      }
      return false;
    };

    findPath(tree, nodeId);
    return path;
  }

  /**
   * Toggle expanded state of a folder
   * Validates: Requirement 4.2
   */
  public toggleExpanded(nodeId: string): void {
    if (this.expandedIds.has(nodeId)) {
      this.expandedIds.delete(nodeId);
    } else {
      this.expandedIds.add(nodeId);
    }
  }

  /**
   * Check if a folder is expanded
   * Validates: Requirement 4.2
   */
  public isExpanded(nodeId: string): boolean {
    return this.expandedIds.has(nodeId);
  }

  /**
   * Get all ancestor IDs for a node
   */
  public getAncestorIds(tree: FolderNode[], nodeId: string): string[] {
    const breadcrumbs = this.getBreadcrumbs(tree, nodeId);
    return breadcrumbs.map((node) => node.id);
  }

  /**
   * Get all descendant IDs for a node
   */
  public getDescendantIds(node: FolderNode): string[] {
    const ids: string[] = [node.id];

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        ids.push(...this.getDescendantIds(child));
      });
    }

    return ids;
  }

  /**
   * Count total notes in a folder and its descendants
   */
  public countNotesRecursive(node: FolderNode): number {
    let count = node.noteCount || 0;

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        count += this.countNotesRecursive(child);
      });
    }

    return count;
  }

  /**
   * Flatten tree to a list
   */
  public flattenTree(tree: FolderNode[]): FolderNode[] {
    const result: FolderNode[] = [];

    const flatten = (nodes: FolderNode[]) => {
      nodes.forEach((node) => {
        result.push(node);
        if (node.children && node.children.length > 0) {
          flatten(node.children);
        }
      });
    };

    flatten(tree);
    return result;
  }

  /**
   * Get depth of a node in the tree
   */
  public getNodeDepth(tree: FolderNode[], nodeId: string): number {
    const breadcrumbs = this.getBreadcrumbs(tree, nodeId);
    return breadcrumbs.length - 1; // Subtract 1 because root is depth 0
  }

  /**
   * Check if a node is a descendant of another node
   */
  public isDescendant(
    tree: FolderNode[],
    ancestorId: string,
    descendantId: string
  ): boolean {
    const ancestor = this.findNode(tree, ancestorId);
    if (!ancestor) return false;

    const descendantIds = this.getDescendantIds(ancestor);
    return descendantIds.includes(descendantId);
  }
}

/**
 * Create a singleton instance
 */
export const folderTreeManager = new FolderTreeManagerImpl();
