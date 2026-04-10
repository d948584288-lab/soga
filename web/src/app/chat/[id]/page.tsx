"use client"

import { useState, useEffect } from "react"
import { useChat } from "@/hooks/use-chat"
import { MessageList } from "@/components/chat/MessageList"

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default function ChatPage({ params }: ChatPageProps) {
  const [inputValue, setInputValue] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)

  // 解析 params - 只执行一次
  useEffect(() => {
    let mounted = true
    params.then(p => {
      if (mounted) setSessionId(p.id)
    })
    return () => { mounted = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    messages,
    streamingContent,
    state,
    sendMessage,
    stop,
    regenerate,
  } = useChat({
    sessionId: sessionId || undefined,
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  const isLoading = state === "loading" || state === "streaming"

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return
    await sendMessage(value)
    setInputValue("")
  }

  return (
    <MessageList
      messages={messages}
      isLoading={state === "loading"}
      isStreaming={state === "streaming"}
      streamingContent={streamingContent}
      inputProps={{
        value: inputValue,
        onChange: setInputValue,
        onSubmit: handleSubmit,
        onStop: stop,
        isLoading: state === "loading",
        isStreaming: state === "streaming",
        placeholder: "输入消息...",
      }}
      onRegenerate={regenerate}
    />
  )
}
