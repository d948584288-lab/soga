/**
 * 登录表单组件
 * - 邮箱/密码验证
 * - 记住我选项
 * - 忘记密码链接
 * - 注册跳转
 */

'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

export function LoginForm({
  onSuccess,
  onRegisterClick,
  onForgotPasswordClick,
}: LoginFormProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 表单数据
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  // 实时验证
  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return '请输入邮箱地址';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱地址';
        return '';
      case 'password':
        if (!value) return '请输入密码';
        if (value.length < 6) return '密码至少6位';
        return '';
      default:
        return '';
    }
  }, []);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    
    // 清除错误
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证所有字段
    const newErrors: Record<string, string> = {};
    newErrors.email = validateField('email', formData.email);
    newErrors.password = validateField('password', formData.password);
    
    // 过滤空错误
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, v]) => v !== '')
    );
    
    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await login(formData.email, formData.password, formData.remember);
      onSuccess?.();
    } catch (err) {
      const error = err as ApiError;
      
      // 根据错误类型显示不同提示
      if (error.statusCode === 401) {
        setErrors({ general: '邮箱或密码错误' });
      } else if (error.statusCode === 429) {
        setErrors({ general: '登录尝试过多，请稍后再试' });
      } else {
        setErrors({ general: error.message || '登录失败，请重试' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 全局错误 */}
      {errors.general && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {errors.general}
        </div>
      )}

      {/* 邮箱 */}
      <Input
        id="login-email"
        name="email"
        type="email"
        label="邮箱地址"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        disabled={isLoading}
        autoFocus
        required
      />

      {/* 密码 */}
      <Input
        id="login-password"
        name="password"
        type="password"
        label="密码"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        disabled={isLoading}
        required
      />

      {/* 记住我和忘记密码 */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="remember"
            checked={formData.remember}
            onChange={handleChange}
            disabled={isLoading}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">记住我</span>
        </label>

        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          忘记密码？
        </button>
      </div>

      {/* 登录按钮 */}
      <Button
        type="submit"
        isFullWidth
        isLoading={isLoading}
        size="lg"
      >
        登录
      </Button>

      {/* 注册链接 */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        还没有账号？
        <button
          type="button"
          onClick={onRegisterClick}
          className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          立即注册
        </button>
      </p>
    </form>
  );
}
