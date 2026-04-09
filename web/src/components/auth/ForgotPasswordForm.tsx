/**
 * 找回密码表单组件
 * 当前阶段：预留UI，提示功能开发中
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 模拟提交，实际功能开发中
    setIsSubmitted(true);
  };

  // 提交成功后的提示状态
  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            功能开发中
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            密码重置功能即将上线，请耐心等待。<br />
            如有紧急情况，请联系管理员。
          </p>
        </div>

        <Button
          variant="outline"
          isFullWidth
          onClick={onBackToLogin}
        >
          返回登录
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 提示信息 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">功能开发中</p>
            <p className="mt-1">密码重置功能即将上线，敬请期待。</p>
          </div>
        </div>
      </div>

      {/* 邮箱输入（预留） */}
      <Input
        id="forgot-email"
        name="email"
        type="email"
        label="邮箱地址"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled
      />

      {/* 发送按钮（禁用） */}
      <Button
        type="submit"
        isFullWidth
        disabled
        size="lg"
      >
        发送重置链接
      </Button>

      {/* 返回登录 */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
      >
        ← 返回登录
      </button>
    </form>
  );
}
