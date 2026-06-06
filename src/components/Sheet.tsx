'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { CloseIcon } from './icons';
import { IconButton } from './ui';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/** Hoja inferior (bottom sheet) accesible, ideal para mobile. */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="absolute inset-0 animate-fade-in bg-black/50"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className={cn(
          'safe-bottom relative z-10 max-h-[85vh] w-full max-w-app animate-fade-in overflow-y-auto rounded-t-3xl border border-border bg-card shadow-xl sm:rounded-3xl',
          className,
        )}
      >
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border sm:hidden" />
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <h2 className="text-lg font-bold">{title}</h2>
            <IconButton label="Cerrar" onClick={onClose}>
              <CloseIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
