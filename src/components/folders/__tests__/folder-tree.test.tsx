/**
 * Unit tests for FolderTree component
 * Validates: Requirements 4.2, 5.1
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FolderTree, type FolderNode } from '../folder-tree';

describe('FolderTree', () => {
  const mockNodes: FolderNode[] = [
    {
      id: '1',
      name: 'Root Folder',
      type: 'folder',
      parentId: null,
      noteCount: 2,
      children: [
        {
          id: '2',
          name: 'Subfolder',
          type: 'folder',
          parentId: '1',
          noteCount: 1,
          children: [
            {
              id: '3',
              name: 'Note 1',
              type: 'note',
              parentId: '2',
            },
          ],
        },
        {
          id: '4',
          name: 'Note 2',
          type: 'note',
          parentId: '1',
        },
      ],
    },
  ];

  it('renders folder tree with nested structure', () => {
    render(<FolderTree nodes={mockNodes} />);

    expect(screen.getByText('Root Folder')).toBeInTheDocument();
    
    // Expand root folder to see children
    const expandButton = screen.getByRole('button', { name: '展开' });
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Subfolder')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
    
    // Expand subfolder to see nested note
    const subfolderExpandButton = screen.getAllByRole('button', { name: '展开' })[0];
    fireEvent.click(subfolderExpandButton);
    
    expect(screen.getByText('Note 1')).toBeInTheDocument();
  });

  it('displays note count for folders', () => {
    render(<FolderTree nodes={mockNodes} />);

    // Root folder should show note count
    const rootFolder = screen.getByText('Root Folder').closest('div');
    expect(rootFolder).toHaveTextContent('2');
  });

  it('handles expand/collapse functionality', () => {
    render(<FolderTree nodes={mockNodes} />);

    // Initially, children should not be visible (collapsed by default)
    expect(screen.queryByText('Subfolder')).not.toBeInTheDocument();

    // Find and click the chevron button to expand
    const expandButton = screen.getByRole('button', { name: '展开' });
    fireEvent.click(expandButton);

    // After expand, subfolder should be visible
    expect(screen.getByText('Subfolder')).toBeInTheDocument();
    
    // Click again to collapse
    const collapseButton = screen.getByRole('button', { name: '折叠' });
    fireEvent.click(collapseButton);
    
    // After collapse, subfolder should not be visible
    expect(screen.queryByText('Subfolder')).not.toBeInTheDocument();
  });

  it('calls onNodeClick when node is clicked', () => {
    const onNodeClick = vi.fn();
    render(<FolderTree nodes={mockNodes} onNodeClick={onNodeClick} />);

    const rootFolder = screen.getByText('Root Folder');
    fireEvent.click(rootFolder);

    expect(onNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        name: 'Root Folder',
        type: 'folder',
      })
    );
  });

  it('highlights selected node', () => {
    render(<FolderTree nodes={mockNodes} selectedNodeId="2" />);

    // Expand root folder to see subfolder
    const expandButton = screen.getByRole('button', { name: '展开' });
    fireEvent.click(expandButton);
    
    const subfolder = screen.getByText('Subfolder').closest('div');
    expect(subfolder).toHaveClass('bg-accent');
  });

  it('handles empty tree', () => {
    const { container } = render(<FolderTree nodes={[]} />);
    expect(container.querySelector('.folder-tree')).toBeEmptyDOMElement();
  });

  it('renders deeply nested folders correctly', () => {
    const deeplyNested: FolderNode[] = [
      {
        id: '1',
        name: 'Level 1',
        type: 'folder',
        parentId: null,
        children: [
          {
            id: '2',
            name: 'Level 2',
            type: 'folder',
            parentId: '1',
            children: [
              {
                id: '3',
                name: 'Level 3',
                type: 'folder',
                parentId: '2',
                children: [
                  {
                    id: '4',
                    name: 'Deep Note',
                    type: 'note',
                    parentId: '3',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    render(<FolderTree nodes={deeplyNested} />);

    expect(screen.getByText('Level 1')).toBeInTheDocument();
    
    // Expand Level 1
    const level1Button = screen.getByRole('button', { name: '展开' });
    fireEvent.click(level1Button);
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    
    // Expand Level 2
    const level2Button = screen.getAllByRole('button', { name: '展开' })[0];
    fireEvent.click(level2Button);
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    
    // Expand Level 3
    const level3Button = screen.getAllByRole('button', { name: '展开' })[0];
    fireEvent.click(level3Button);
    expect(screen.getByText('Deep Note')).toBeInTheDocument();
  });
});
