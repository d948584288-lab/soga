/**
 * 流式聊天 Hook
 * 支持打字机效果的 SSE 流式输出
 */

import { useState, useCallback, useRef } from 'react';
import { ChatStreamChunk } from '@/types/chat';

interface UseChatStreamOptions {
  onChunk?: (content: string) => void;
  onComplete?: (data: {
    fullContent: string;
    usage?: ChatStreamChunk['usage'];
    cost?: number;
    latency?: number;
  }) => void;
  onError?: (error: Error) => void;
}

interface UseChatStreamReturn {
  isStreaming: boolean;
  sendMessage: (
    sessionId: string,
    content: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) => Promise<void>;
  cancel: () => void;
}

export function useChatStream(options: UseChatStreamOptions = {}): UseChatStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      sessionId: string,
      content: string,
      streamOptions?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
      }
    ) => {
      const token = localStorage.getItem('token');
      if (!token) {
        options.onError?.(new Error('请先登录'));
        return;
      }

      setIsStreaming(true);
      let fullContent = '';

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch(`/api/chat/sessions/${sessionId}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            stream: true,
            ...streamOptions,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: '请求失败' }));
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        // 读取 SSE 流
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              
              if (dataStr === '[DONE]') continue;

              try {
                const data: { data: ChatStreamChunk } = JSON.parse(dataStr);
                const chunkData = data.data;

                switch (chunkData.type) {
                  case 'start':
                    // 开始生成
                    break;
                  case 'chunk':
                    if (chunkData.content) {
                      fullContent += chunkData.content;
                      options.onChunk?.(fullContent);
                    }
                    break;
                  case 'end':
                    options.onComplete?.({
                      fullContent,
                      usage: chunkData.usage,
                      cost: chunkData.cost,
                      latency: chunkData.latency,
                    });
                    setIsStreaming(false);
                    return;
                  case 'error':
                    throw new Error(chunkData.error || 'Stream error');
                }
              } catch (e) {
                console.error('Failed to parse chunk:', e);
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // 用户取消
          options.onComplete?.({ fullContent });
        } else {
          options.onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [options]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    sendMessage,
    cancel,
  };
}
