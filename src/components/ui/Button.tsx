import React from 'react';
import { cn } from './Card';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-light shadow-sm hover:shadow-md transition-all',
      secondary: 'bg-white text-text-main hover:bg-gray-50 ring-1 ring-inset ring-black/5 shadow-sm transition-all',
      danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm transition-all',
      ghost: 'bg-transparent text-text-muted hover:text-text-main hover:bg-forest transition-all',
    };

    const sizes = {
      sm: 'px-4 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-8 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
