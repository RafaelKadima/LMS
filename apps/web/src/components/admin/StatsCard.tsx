'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'glass relative rounded-xl p-6 border border-white/[0.06] overflow-hidden border-accent-top',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-body text-white/50 tracking-wide">{title}</p>
          <p className="text-3xl font-bold font-display text-white">{value}</p>
          {subtitle && (
            <p className="text-sm font-body text-white/30 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                'text-sm mt-2 flex items-center gap-1.5',
                trend.isPositive ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              <motion.span
                initial={{ y: trend.isPositive ? 4 : -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="inline-flex"
              >
                {trend.isPositive ? '↑' : '↓'}
              </motion.span>
              <span className="font-medium">{Math.abs(trend.value)}%</span>
              <span className="text-white/30 ml-0.5">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[radial-gradient(circle,var(--color-brand-500)/0.2,transparent_70%)]">
          <Icon className="w-6 h-6 text-brand-500" />
        </div>
      </div>
    </div>
  );
}
