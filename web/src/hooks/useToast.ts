/**
 * Toast 管理 Hook
 * 全局 Toast 状态管理
 */

'use client';

import { useState, useCallback } from 'react';
import { ToastItem, ToastType } from '@/components/ui/Toast';

let globalAddToast: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  // 便捷方法
  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'success', title, message, duration });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'error', title, message, duration: duration || 6000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'warning', title, message, duration });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'info', title, message, duration });
    },
    [addToast]
  );

  // 注册全局方法（用于在组件外调用）
  if (typeof window !== 'undefined') {
    globalAddToast = addToast;
  }

  return {
    toasts,
    removeToast,
    addToast,
    success,
    error,
    warning,
    info,
  };
}

// 全局 Toast 方法（可在组件外使用）
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    globalAddToast?.({ type: 'success', title, message, duration });
  },
  error: (title: string, message?: string, duration?: number) => {
    globalAddToast?.({ type: 'error', title, message, duration: duration || 6000 });
  },
  warning: (title: string, message?: string, duration?: number) => {
    globalAddToast?.({ type: 'warning', title, message, duration });
  },
  info: (title: string, message?: string, duration?: number) => {
    globalAddToast?.({ type: 'info', title, message, duration });
  },
};
