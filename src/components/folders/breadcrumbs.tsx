'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Breadcrumbs Component
 * Displays the folder path from root to current location
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

export interface BreadcrumbItem {
  id: string;
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  maxItems?: number;
}

export function Breadcrumbs({ items, className, maxItems = 5 }: BreadcrumbsProps) {
  // Always show home
  const homeItem: BreadcrumbItem = {
    id: 'home',
    name: '首页',
    href: '/notes',
  };

  const allItems = [homeItem, ...items];

  // Handle long paths with ellipsis
  const displayItems = allItems.length > maxItems
    ? [
        allItems[0],
        { id: 'ellipsis', name: '...', href: '#' },
        ...allItems.slice(-(maxItems - 2)),
      ]
    : allItems;

  return (
    <nav
      aria-label="面包屑导航"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const isEllipsis = item.id === 'ellipsis';

        return (
          <div key={item.id} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}

            {isEllipsis ? (
              <span
                className="px-2 py-1 text-muted-foreground"
                title={allItems.slice(1, -maxItems + 3).map(i => i.name).join(' / ')}
              >
                {item.name}
              </span>
            ) : isLast ? (
              <span className="px-2 py-1 font-medium text-foreground">
                {index === 0 ? (
                  <span className="flex items-center gap-1">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    <span>{item.name}</span>
                  </span>
                ) : (
                  item.name
                )}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'px-2 py-1 rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'text-muted-foreground'
                )}
                aria-label={index === 0 ? item.name : undefined}
              >
                {index === 0 ? (
                  <span className="flex items-center gap-1">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{item.name}</span>
                  </span>
                ) : (
                  item.name
                )}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
