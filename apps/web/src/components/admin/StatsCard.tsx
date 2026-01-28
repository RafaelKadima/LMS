'use client';

import { LucideIcon } from 'lucide-react';

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
    <div className={`bg-surface-card rounded-xl p-6 border border-gray-800 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`text-sm mt-2 flex items-center gap-1 ${
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500 ml-1">vs mês anterior</span>
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-brand-500" />
        </div>
      </div>
    </div>
  );
}
