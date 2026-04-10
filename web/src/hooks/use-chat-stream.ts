"use client"

import { useState, useRef, useCallback } from "react"

export type ChatStatus = "idle" | "loading" | "streaming" | "error"

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: Date
}

interface UseChatStreamOptions {
  sessionId: string
  onError?: (error: Error) => void
}

export function useChatStream({ sessionId, onError }: UseChatStreamOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<ChatStatus>("idle")
  const [error, setError] = useState<Error | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  // 发送消息（支持流式）
  const sendMessage = useCallback(async (content: string) => {
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setStatus("loading")
    setError(null)

    try {
      // 创建 AI 消息占位
      const aiMessageId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: "",
          createdAt: new Date(),
        },
      ])

      // 发起 SSE 请求
      abortControllerRef.current = new AbortController()
      const token = localStorage.getItem("token")
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/sessions/${sessionId}/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ content, model: "moonshot-v1-32k" }),
          signal: abortControllerRef.current.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error("No response body")

      setStatus("streaming")
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.data?.content) {
                fullContent += parsed.data.content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                )
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      setStatus("idle")
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // 用户主动取消，不显示错误
        setStatus("idle")
      } else {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setStatus("error")
        onError?.(error)
      }
    }
  }, [sessionId, onError])

  // 打断/取消生成
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    setStatus("idle")
  }, [])

  // 重新生成最后一条消息
  const regenerate = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")
    if (lastUserMessage) {
      // 删除最后一条 AI 消息
      setMessages((prev) => prev.slice(0, -1))
      sendMessage(lastUserMessage.content)
    }
  }, [messages, sendMessage])

  // 清空对话
  const clearMessages = useCallback(() => {
    setMessages([])
    setStatus("idle")
    setError(null)
  }, [])

  return {
    messages,
    status,
    error,
    sendMessage,
    stopGeneration,
    regenerate,
    clearMessages,
    isGenerating: status === "loading" || status === "streaming",
  }
}
