'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
  mobileCardRenderer?: (row: T) => React.ReactNode;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded bg-white/[0.06] animate-pulse shimmer" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-lg p-4 border border-white/[0.06] space-y-3">
      <div className="h-4 w-2/3 rounded bg-white/[0.06] animate-pulse shimmer" />
      <div className="h-3 w-1/2 rounded bg-white/[0.04] animate-pulse shimmer" />
      <div className="h-3 w-3/4 rounded bg-white/[0.04] animate-pulse shimmer" />
    </div>
  );
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = 'Buscar...',
  searchKey,
  onRowClick,
  actions,
  pagination,
  emptyMessage = 'Nenhum item encontrado',
  mobileCardRenderer,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const isMobile = useIsMobile();

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!search || !searchKey) return data;
    const searchLower = search.toLowerCase();
    return data.filter((row) => {
      const value = row[searchKey];
      return value && String(value).toLowerCase().includes(searchLower);
    });
  }, [data, search, searchKey]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = aVal < bVal ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.perPage)
    : 1;

  // -- Mobile card rendering --
  const renderMobileCard = (row: T, index: number) => {
    if (mobileCardRenderer) {
      return mobileCardRenderer(row);
    }
    // Default: show first 3 columns as key-value pairs
    const displayCols = columns.slice(0, 3);
    return (
      <div className="space-y-2">
        {displayCols.map((col) => (
          <div key={col.key} className="flex items-center justify-between gap-2">
            <span className="text-xs text-white/40 font-body uppercase tracking-wider">
              {col.header}
            </span>
            <span className="text-sm text-white font-body text-right">
              {col.render ? col.render(row) : row[col.key] ?? '-'}
            </span>
          </div>
        ))}
        {actions && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
            {actions(row)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Search */}
      {searchKey && (
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg',
                'text-white placeholder-white/30 font-body',
                'focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all'
              )}
            />
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      {isMobile ? (
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : sortedData.length === 0 ? (
            <p className="py-12 text-center text-white/40 font-body">
              {emptyMessage}
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedData.map((row, index) => (
                <motion.div
                  key={row.id || index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'glass rounded-lg p-4 border border-white/[0.06]',
                    onRowClick && 'cursor-pointer active:bg-white/[0.04]'
                  )}
                >
                  {renderMobileCard(row, index)}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      ) : (
        /* Desktop Table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => column.sortable && handleSort(column.key)}
                    className={cn(
                      'px-4 py-3 text-left text-[11px] font-display font-semibold uppercase tracking-[0.08em] text-white/40',
                      column.sortable && 'cursor-pointer hover:text-white/70 transition-colors select-none',
                      column.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {column.header}
                      {column.sortable && sortKey === column.key && (
                        <motion.span
                          initial={{ opacity: 0, y: sortOrder === 'asc' ? 4 : -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="text-brand-500"
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5" />
                          )}
                        </motion.span>
                      )}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-right text-[11px] font-display font-semibold uppercase tracking-[0.08em] text-white/40 w-20">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={columns.length + (actions ? 1 : 0)} />
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-4 py-12 text-center text-white/40 font-body"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedData.map((row, index) => (
                    <motion.tr
                      key={row.id || index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        'border-b border-white/[0.04] last:border-0 transition-colors',
                        onRowClick
                          ? 'cursor-pointer hover:bg-white/[0.02]'
                          : 'hover:bg-white/[0.02]'
                      )}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-4 text-sm text-white font-body',
                            column.className
                          )}
                        >
                          {column.render
                            ? column.render(row)
                            : row[column.key] ?? '-'}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {actions(row)}
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
          {!isMobile && (
            <p className="text-sm text-white/40 font-body">
              Mostrando {(pagination.page - 1) * pagination.perPage + 1} -{' '}
              {Math.min(pagination.page * pagination.perPage, pagination.total)} de{' '}
              {pagination.total}
            </p>
          )}

          <div className={cn('flex items-center gap-1', isMobile && 'w-full justify-between')}>
            {!isMobile && (
              <button
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-sm text-white/50 font-body tabular-nums">
              {pagination.page} / {totalPages}
            </span>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isMobile && (
              <button
                onClick={() => pagination.onPageChange(totalPages)}
                disabled={pagination.page === totalPages}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
