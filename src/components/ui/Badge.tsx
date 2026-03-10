import React from 'react';
import { cn } from './Card';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  const variants = {
    success: 'bg-primary/20 text-primary border border-primary/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    danger: 'bg-danger/20 text-danger border border-danger/30',
    neutral: 'bg-white text-text-muted border border-border',
    primary: 'bg-primary text-white border border-primary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
