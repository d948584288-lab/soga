/**
 * 注册表单组件
 * - 邮箱/密码/确认密码验证
 * - 密码强度检测
 * - 显示名称（可选）
 */

'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 表单数据
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  // 密码强度计算
  const getPasswordStrength = (password: string): { level: number; text: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { level: 0, text: '太弱', color: 'bg-red-500' },
      { level: 1, text: '弱', color: 'bg-orange-500' },
      { level: 2, text: '一般', color: 'bg-yellow-500' },
      { level: 3, text: '强', color: 'bg-blue-500' },
      { level: 4, text: '非常强', color: 'bg-green-500' },
    ];

    return levels[score];
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // 实时验证
  const validateField = useCallback((name: string, value: string, allData = formData): string => {
    switch (name) {
      case 'email':
        if (!value) return '请输入邮箱地址';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱地址';
        return '';
      case 'password':
        if (!value) return '请输入密码';
        if (value.length < 6) return '密码至少6位';
        if (value.length < 8) return '建议密码至少8位';
        return '';
      case 'confirmPassword':
        if (!value) return '请确认密码';
        if (value !== allData.password) return '两次输入的密码不一致';
        return '';
      case 'displayName':
        return ''; // 可选
      default:
        return '';
    }
  }, [formData]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // 如果是修改密码，重新验证确认密码
      if (name === 'password' && prev.confirmPassword) {
        const confirmError = validateField('confirmPassword', prev.confirmPassword, newData);
        if (confirmError) {
          setErrors((err) => ({ ...err, confirmPassword: confirmError }));
        }
      }
      
      return newData;
    });
    
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
    newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);
    
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
      await register(
        formData.email,
        formData.password,
        formData.displayName || undefined
      );
      onSuccess?.();
    } catch (err) {
      const error = err as ApiError;
      
      if (error.statusCode === 409) {
        setErrors({ email: '该邮箱已被注册' });
      } else {
        setErrors({ general: error.message || '注册失败，请重试' });
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
        id="register-email"
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

      {/* 显示名称（可选） */}
      <Input
        id="register-displayName"
        name="displayName"
        type="text"
        label="显示名称"
        placeholder="您的名字（可选）"
        value={formData.displayName}
        onChange={handleChange}
        disabled={isLoading}
      />

      {/* 密码 */}
      <div>
        <Input
          id="register-password"
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
        
        {/* 密码强度条 */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex gap-1 h-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`flex-1 rounded-full transition-colors ${
                    level <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className={`mt-1 text-xs ${passwordStrength.level >= 2 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              密码强度：{passwordStrength.text}
            </p>
          </div>
        )}
      </div>

      {/* 确认密码 */}
      <Input
        id="register-confirmPassword"
        name="confirmPassword"
        type="password"
        label="确认密码"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        disabled={isLoading}
        required
      />

      {/* 注册按钮 */}
      <Button
        type="submit"
        isFullWidth
        isLoading={isLoading}
        size="lg"
      >
        注册
      </Button>

      {/* 登录链接 */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        已有账号？
        <button
          type="button"
          onClick={onLoginClick}
          className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          立即登录
        </button>
      </p>
    </form>
  );
}
