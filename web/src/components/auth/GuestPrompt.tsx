/**
 * 游客提示组件
 * 未登录用户尝试发送消息时显示
 */

'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface GuestPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export function GuestPrompt({
  isOpen,
  onClose,
  onLogin,
  onRegister,
}: GuestPromptProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="登录以继续对话"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          登录后可以：
        </p>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            保存对话历史
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            跨设备同步
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            体验更多功能
          </li>
        </ul>

        <div className="space-y-2 pt-2">
          <Button
            isFullWidth
            onClick={() => {
              onClose();
              onLogin();
            }}
          >
            登录
          </Button>
          <Button
            variant="outline"
            isFullWidth
            onClick={() => {
              onClose();
              onRegister();
            }}
          >
            注册账号
          </Button>
          <Button
            variant="ghost"
            isFullWidth
            onClick={onClose}
          >
            暂不登录
          </Button>
        </div>
      </div>
    </Modal>
  );
}
