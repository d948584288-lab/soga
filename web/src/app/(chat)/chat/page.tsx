/**
 * 聊天主页面
 * 整合认证状态、会话管理、消息发送
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { chatApi, llmApi, createChatStream, TokenManager } from '@/lib/api';
import { Session, Message, LlmModel } from '@/types/chat';
import { AuthModal } from '@/components/auth/AuthModal';
import { GuestPrompt } from '@/components/auth/GuestPrompt';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/Button';

export default function ChatPage() {
  // 认证状态
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  // 弹窗状态
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [authDefaultView, setAuthDefaultView] = useState<'login' | 'register'>('login');

  // 会话和消息状态
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [models, setModels] = useState<LlmModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载模型列表
  useEffect(() => {
    llmApi.getModels().then(({ data, default: defaultModel }) => {
      setModels(data);
      setSelectedModel(defaultModel?.id || data[0]?.id || '');
    }).catch(console.error);
  }, []);

  // 加载会话列表（仅登录用户）
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const loadSessions = async () => {
    try {
      const { data } = await chatApi.getSessions();
      setSessions(data);
      if (data.length > 0 && !currentSession) {
        selectSession(data[0]);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const selectSession = async (session: Session) => {
    setCurrentSession(session);
    setSelectedModel(session.model);
    try {
      const { data } = await chatApi.getMessages(session.id);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const createNewSession = async () => {
    if (!isAuthenticated) {
      setAuthDefaultView('login');
      setShowAuthModal(true);
      return;
    }

    try {
      const session = await chatApi.createSession({ model: selectedModel });
      setSessions([session, ...sessions]);
      selectSession(session);
      success('新会话已创建');
    } catch (err) {
      error('创建会话失败');
    }
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个会话吗？')) return;

    try {
      await chatApi.deleteSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      success('会话已删除');
    } catch (err) {
      error('删除失败');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    // 未登录用户提示
    if (!isAuthenticated) {
      setShowGuestPrompt(true);
      return;
    }

    const content = input.trim();
    setInput('');

    // 如果没有当前会话，先创建一个
    let sessionId = currentSession?.id;
    if (!sessionId) {
      try {
        const session = await chatApi.createSession({ model: selectedModel });
        setSessions([session, ...sessions]);
        setCurrentSession(session);
        sessionId = session.id;
      } catch (err) {
        error('创建会话失败');
        return;
      }
    }

    // 添加用户消息到界面
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // 开始流式输出
    setIsStreaming(true);
    setStreamingContent('');

    const stream = createChatStream(sessionId, content, {
      model: selectedModel,
      onChunk: (content) => {
        setStreamingContent(content);
      },
      onComplete: () => {
        setIsStreaming(false);
        setStreamingContent('');
        // 刷新消息列表
        if (sessionId) {
          chatApi.getMessages(sessionId).then(({ data }) => {
            setMessages(data);
          });
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingContent('');
        error(err.message || '发送失败');
      },
    });

    stream.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 渲染侧边栏底部（登录/用户菜单）
  const renderSidebarFooter = () => {
    if (authLoading) {
      return (
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return <UserMenu />;
    }

    return (
      <div className="space-y-2">
        <Button
          isFullWidth
          onClick={() => {
            setAuthDefaultView('login');
            setShowAuthModal(true);
          }}
        >
          登录
        </Button>
        <Button
          variant="outline"
          isFullWidth
          onClick={() => {
            setAuthDefaultView('register');
            setShowAuthModal(true);
          }}
        >
          注册
        </Button>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* 认证弹窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView={authDefaultView}
        onSuccess={() => {
          success('登录成功');
          loadSessions();
        }}
      />

      {/* 游客提示 */}
      <GuestPrompt
        isOpen={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
        onLogin={() => {
          setAuthDefaultView('login');
          setShowAuthModal(true);
        }}
        onRegister={() => {
          setAuthDefaultView('register');
          setShowAuthModal(true);
        }}
      />

      {/* 侧边栏 */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={createNewSession}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新会话
          </button>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isAuthenticated ? (
            sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                暂无会话<br />点击上方创建
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => selectSession(session)}
                  className={`
                    group p-3 rounded-lg cursor-pointer transition-colors
                    ${currentSession?.id === session.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                      {session.title}
                    </p>
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(session.updatedAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              ))
            )
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm px-4">
              <p>登录后可保存</p>
              <p>对话历史</p>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {renderSidebarFooter()}
        </div>
      </div>

      {/* 主聊天区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentSession?.title || '新会话'}
          </h2>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">👋 开始对话吧</p>
                <p className="text-sm">
                  {isAuthenticated 
                    ? '发送消息与 AI 助手交流' 
                    : '登录后可保存对话历史'}
                </p>
              </div>
            </div>
          ) : (
            messages
              .filter((m) => m.role !== 'system')
              .map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-3xl px-4 py-2 rounded-2xl
                      ${message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.model && (
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {message.model}
                      </p>
                    )}
                  </div>
                </div>
              ))
          )}

          {/* 流式输出内容 */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-3xl px-4 py-2 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAuthenticated ? "输入消息...（Enter 发送）" : "登录后即可发送消息..."}
              disabled={isStreaming}
              rows={1}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {isStreaming ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          {!isAuthenticated && (
            <p className="mt-2 text-xs text-center text-gray-500">
              <button
                onClick={() => {
                  setAuthDefaultView('login');
                  setShowAuthModal(true);
                }}
                className="text-blue-600 hover:underline"
              >
                登录
              </button>
              {' '}后可保存对话历史
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
