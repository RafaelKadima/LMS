'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        href="/materials"
        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Materiais</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const displayName = item.name.replace(/^\d+-/, '').replace(/-/g, ' ');

        return (
          <div key={item.id} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-600" />
            {isLast ? (
              <span className="text-white font-medium capitalize">{displayName}</span>
            ) : (
              <Link
                href={`/materials/${item.id}`}
                className="text-gray-400 hover:text-white transition-colors capitalize"
              >
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
