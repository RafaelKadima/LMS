'use client';

import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  children,
}: PageHeaderProps) {
  const isMobile = useIsMobile();

  // On mobile, collapse breadcrumbs to last 2 items
  const visibleBreadcrumbs =
    breadcrumbs && isMobile && breadcrumbs.length > 2
      ? breadcrumbs.slice(-2)
      : breadcrumbs;

  const showEllipsis =
    breadcrumbs && isMobile && breadcrumbs.length > 2;

  const actionElement = action ? (
    action.href ? (
      <Link
        href={action.href}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium font-body',
          isMobile && 'w-full'
        )}
      >
        <Plus className="w-5 h-5" />
        {action.label}
      </Link>
    ) : (
      <button
        onClick={action.onClick}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium font-body',
          isMobile && 'w-full'
        )}
      >
        <Plus className="w-5 h-5" />
        {action.label}
      </button>
    )
  ) : null;

  return (
    <div className="mb-8 pb-6 border-b border-gradient-fade">
      {/* Breadcrumbs */}
      {visibleBreadcrumbs && visibleBreadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm font-body text-white/40 mb-4">
          {showEllipsis && (
            <>
              <span className="text-white/30">...</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            </>
          )}
          {visibleBreadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-white/20" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-white/60">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title and Action */}
      <div
        className={cn(
          'flex gap-4',
          isMobile
            ? 'flex-col'
            : 'flex-row items-center justify-between'
        )}
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            {title}
          </h1>
          {description && (
            <p className="text-white/40 font-body mt-1">{description}</p>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-3',
            isMobile && 'flex-col'
          )}
        >
          {children}
          {actionElement}
        </div>
      </div>
    </div>
  );
}
