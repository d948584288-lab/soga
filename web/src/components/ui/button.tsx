/**
 * 按钮组件 - 企业级标准
 * - 多种变体
 * - 加载状态
 * - 图标支持
 * - 全宽选项
 * - 禁用状态
 */

'use client';

import { forwardRef, ReactNode, ButtonHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading,
      isFullWidth,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // 尺寸样式
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    // 变体样式
    const variantClasses = {
      primary: cn(
        'bg-blue-600 text-white',
        'hover:bg-blue-700 active:bg-blue-800',
        'focus:ring-blue-500/30',
        'disabled:bg-blue-400'
      ),
      secondary: cn(
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200 active:bg-gray-300',
        'focus:ring-gray-500/30',
        'dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
        'disabled:bg-gray-100 dark:disabled:bg-gray-800'
      ),
      outline: cn(
        'bg-transparent border-2 border-gray-300 text-gray-700',
        'hover:bg-gray-50 active:bg-gray-100',
        'focus:ring-gray-500/30',
        'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
        'disabled:opacity-50'
      ),
      ghost: cn(
        'bg-transparent text-gray-700',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus:ring-gray-500/30',
        'dark:text-gray-300 dark:hover:bg-gray-800',
        'disabled:opacity-50'
      ),
      danger: cn(
        'bg-red-600 text-white',
        'hover:bg-red-700 active:bg-red-800',
        'focus:ring-red-500/30',
        'disabled:bg-red-400'
      ),
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center',
          'font-medium rounded-lg',
          'transition-all duration-200',
          'focus:outline-none focus:ring-4',
          'disabled:cursor-not-allowed',
          
          // 应用变体和尺寸
          variantClasses[variant],
          sizeClasses[size],
          
          // 全宽
          isFullWidth && 'w-full',
          
          // 图标间距
          leftIcon && 'gap-2',
          rightIcon && 'gap-2',
          
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
