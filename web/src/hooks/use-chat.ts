"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Message, Session, LlmModel } from "@/types"
import { chatApi, llmApi } from "@/lib/api-client"

export type ChatState = "idle" | "loading" | "streaming" | "error" | "complete"

export interface UseChatOptions {
  sessionId?: string
  onError?: (error: Error) => void
  onSessionCreated?: (session: Session) => void
}

export function useChat({ sessionId, onError, onSessionCreated }: UseChatOptions) {
  const [state, setState] = useState<ChatState>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const [models, setModels] = useState<LlmModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasInitializedModel = useRef(false)
  const errorHandlerRef = useRef(onError)
  const sessionCreatedHandlerRef = useRef(onSessionCreated)

  // 同步 handlers
  useEffect(() => {
    errorHandlerRef.current = onError
    sessionCreatedHandlerRef.current = onSessionCreated
  }, [onError, onSessionCreated])

  // 获取可用模型 - 只在组件挂载时执行一次
  useEffect(() => {
    let cancelled = false
    
    const fetchModels = async () => {
      try {
        const data = await llmApi.getModels()
        if (cancelled) return
        
        setModels(data.data)
        if (!hasInitializedModel.current) {
          hasInitializedModel.current = true
          const defaultModel = data.data.find((m: LlmModel) => m.default) || data.data[0]
          if (defaultModel) {
            setSelectedModel(defaultModel.id)
          }
        }
      } catch (err) {
        console.error("Failed to fetch models:", err)
      }
    }
    
    fetchModels()
    return () => { cancelled = true }
  }, [])

  // 当 sessionId 变化时加载会话
  useEffect(() => {
    if (!sessionId) {
      setCurrentSession(null)
      setMessages([])
      setState("idle")
      return
    }

    let cancelled = false

    const loadSession = async () => {
      try {
        const session = await chatApi.getSession(sessionId)
        if (cancelled) return
        
        setCurrentSession(session)
        setMessages(session.messages || [])
        setState("idle")
        
        if (session.model) {
          setSelectedModel(prev => prev || session.model)
        }
      } catch (err) {
        if (cancelled) return
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        errorHandlerRef.current?.(error)
      }
    }

    loadSession()
    return () => { cancelled = true }
  }, [sessionId])

  // 发送消息
  const sendMessage = useCallback(async (content: string, model?: string) => {
    if (!content.trim()) return

    setError(null)
    setStreamingContent("")
    
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      sessionId: currentSession?.id || "",
      userId: "",
      model: model || selectedModel,
      tokens: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setState("loading")

    try {
      let session = currentSession
      if (!session) {
        session = await chatApi.createSession({
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          model: model || selectedModel,
        })
        setCurrentSession(session)
        sessionCreatedHandlerRef.current?.(session)
      }

      abortControllerRef.current = new AbortController()
      
      const response = await chatApi.sendMessageStream(session.id, {
        content,
        model: model || selectedModel,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      setState("streaming")
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue

          const data = line.slice(6)
          if (data === "[DONE]" || data === "[DONE]\n") continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.data?.content !== undefined) {
              fullContent += parsed.data.content
              setStreamingContent(fullContent)
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      // 重新加载会话获取完整消息
      const updatedSession = await chatApi.getSession(session.id)
      setMessages(updatedSession.messages || [])
      setStreamingContent("")
      setState("complete")
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setState("idle")
      } else {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setState("error")
        errorHandlerRef.current?.(error)
      }
    }
  }, [currentSession, selectedModel])

  // 停止生成
  const stop = useCallback(() => {
    abortControllerRef.current?.abort()
    setState("idle")
    setStreamingContent("")
  }, [])

  // 重新生成
  const regenerate = useCallback(async () => {
    if (!currentSession || messages.length < 2) return

    const lastUserMessage = messages.filter(m => m.role === "user").pop()
    if (!lastUserMessage) return

    setMessages(prev => prev.slice(0, -1))
    await sendMessage(lastUserMessage.content)
  }, [currentSession, messages, sendMessage])

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([])
    setCurrentSession(null)
    setState("idle")
    setError(null)
    setStreamingContent("")
  }, [])

  return {
    state,
    messages,
    streamingContent,
    error,
    currentSession,
    models,
    selectedModel,
    setSelectedModel,
    sendMessage,
    stop,
    regenerate,
    clearMessages,
  }
}
