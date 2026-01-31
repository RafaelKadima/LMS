'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const isMobile = useIsMobile();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const variantStyles = {
    danger: {
      icon: 'text-red-400 bg-red-500/[0.1]',
      button: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: 'text-amber-400 bg-amber-500/[0.1]',
      button: 'bg-amber-500 hover:bg-amber-600',
    },
    info: {
      icon: 'text-brand-500 bg-brand-500/[0.1]',
      button: 'bg-brand-500 hover:bg-brand-600',
    },
  };

  const styles = variantStyles[variant];

  // Desktop: center with scale animation; Mobile: bottom sheet slide up
  const modalVariants = isMobile
    ? {
        hidden: { y: '100%', opacity: 1 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 300 } },
        exit: { y: '100%', opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden: { scale: 0.95, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 350 } },
        exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'glass-strong relative border border-white/[0.08] shadow-2xl',
              isMobile
                ? 'w-full rounded-t-2xl p-6 pb-8'
                : 'max-w-md w-full mx-4 rounded-xl p-6'
            )}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-white/[0.15]" />
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center mb-4',
                styles.icon
              )}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold font-display text-white mb-2">
              {title}
            </h3>
            <p className="text-white/50 font-body mb-6">{message}</p>

            {/* Actions */}
            <div className={cn('flex gap-3', isMobile ? 'flex-col-reverse' : 'flex-row')}>
              <button
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2.5 bg-white/[0.06] text-white rounded-lg hover:bg-white/[0.1] transition-colors font-medium font-body border border-white/[0.06] disabled:opacity-50'
                )}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium font-body disabled:opacity-50',
                  styles.button
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                    Processando...
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
