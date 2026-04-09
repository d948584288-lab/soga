/**
 * 认证弹窗容器
 * 整合登录、注册、找回密码表单
 */

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthView = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: AuthView;
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultView = 'login',
  onSuccess,
}: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);

  // 切换视图时重置状态
  const handleViewChange = (view: AuthView) => {
    setCurrentView(view);
  };

  // 成功回调
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  // 获取标题
  const getTitle = () => {
    switch (currentView) {
      case 'login':
        return '欢迎回来';
      case 'register':
        return '创建账号';
      case 'forgot':
        return '找回密码';
      default:
        return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="md"
    >
      {currentView === 'login' && (
        <LoginForm
          onSuccess={handleSuccess}
          onRegisterClick={() => handleViewChange('register')}
          onForgotPasswordClick={() => handleViewChange('forgot')}
        />
      )}

      {currentView === 'register' && (
        <RegisterForm
          onSuccess={handleSuccess}
          onLoginClick={() => handleViewChange('login')}
        />
      )}

      {currentView === 'forgot' && (
        <ForgotPasswordForm
          onBackToLogin={() => handleViewChange('login')}
        />
      )}
    </Modal>
  );
}
