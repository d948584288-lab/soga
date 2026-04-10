"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { Message } from "@/types"
import { ChatMessage } from "./ChatMessage"
import { ChatInput, ChatInputProps } from "./ChatInput"
import { Button } from "@/components/ui/Button"

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  inputProps: ChatInputProps
  header?: React.ReactNode
  onRegenerate?: () => void
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
  inputProps,
  header,
  onRegenerate,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const autoScrollRef = useRef(true)
  const lastMessageCount = useRef(messages.length)
  const streamingContentRef = useRef(streamingContent)

  // 更新 streaming ref
  useEffect(() => {
    streamingContentRef.current = streamingContent
  }, [streamingContent])

  // 检查滚动位置
  const checkScrollPosition = useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    
    setIsNearBottom(isNearBottom)
    setShowScrollButton(!isNearBottom && messages.length > 0)
    autoScrollRef.current = isNearBottom
  }, [messages.length])

  // 滚动到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior })
    setShowScrollButton(false)
    setIsNearBottom(true)
    autoScrollRef.current = true
  }, [])

  // 监听滚动事件
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      checkScrollPosition()
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [checkScrollPosition])

  // 新消息或流式内容更新时自动滚动
  useEffect(() => {
    // 如果有新消息或者是流式输出，自动滚动
    const hasNewMessages = messages.length > lastMessageCount.current
    lastMessageCount.current = messages.length

    if ((hasNewMessages || isStreaming) && autoScrollRef.current) {
      scrollToBottom(isStreaming ? "auto" : "smooth")
    }
  }, [messages.length, isStreaming, scrollToBottom])

  // 流式内容更新时滚动
  useEffect(() => {
    if (isStreaming && streamingContent && autoScrollRef.current) {
      scrollToBottom("auto")
    }
  }, [streamingContent, isStreaming, scrollToBottom])

  const showWelcome = messages.length === 0 && !isLoading && !isStreaming

  return (
    <div className="flex flex-col h-full relative">
      {header && <div className="flex-shrink-0">{header}</div>}

      {/* 消息区域 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="max-w-3xl mx-auto px-4 py-6">
          {showWelcome ? (
            <WelcomeView inputProps={inputProps} />
          ) : (
            <>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                >
                  <ChatMessage
                    message={message}
                    isStreaming={false}
                    isLast={index === messages.length - 1 && !isStreaming}
                    onRegenerate={
                      index === messages.length - 1 && message.role === "assistant"
                        ? onRegenerate
                        : undefined
                    }
                  />
                </motion.div>
              ))}

              {/* 流式消息 */}
              {isStreaming && streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6"
                >
                  <ChatMessage
                    message={{
                      id: "streaming",
                      role: "assistant",
                      content: streamingContent,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      sessionId: "",
                      userId: "",
                      model: "",
                      tokens: 0,
                    }}
                    isStreaming={true}
                    isLast={true}
                  />
                </motion.div>
              )}

              {/* Loading 占位 */}
              {isLoading && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6 flex items-center gap-2 text-gray-500"
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </motion.div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>

      {/* 回到底部按钮 */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => scrollToBottom()}
              className="rounded-full shadow-lg px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              回到底部
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入区域 */}
      {!showWelcome && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput {...inputProps} />
          </div>
        </div>
      )}
    </div>
  )
}

// 欢迎页面
function WelcomeView({ inputProps }: { inputProps: ChatInputProps }) {
  const suggestions = [
    { icon: "📝", title: "帮我写代码", desc: "编写 Python、JavaScript 等语言的代码片段" },
    { icon: "💡", title: "头脑风暴", desc: "激发创意，获得新想法和建议" },
    { icon: "📚", title: "解释概念", desc: "深入浅出地解释复杂概念" },
    { icon: "🔧", title: "调试问题", desc: "分析错误并提供解决方案" },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
          Soga AI
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          你的智能助手，随时为你服务
        </p>
      </div>

      {/* 快捷功能 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 w-full max-w-2xl">
        {suggestions.map((item, index) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              const prompts: Record<string, string> = {
                "帮我写代码": "帮我写一个 Python 函数，实现...",
                "头脑风暴": "帮我头脑风暴一下关于...的想法",
                "解释概念": "请解释一下什么是...",
                "调试问题": "我的代码出现了以下错误，请帮我分析：",
              }
              inputProps.onChange(prompts[item.title] || "")
            }}
            className="text-left p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:-translate-y-0.5 bg-white dark:bg-gray-800 transition-all duration-200"
          >
            <div className="text-2xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {item.desc}
            </p>
          </motion.button>
        ))}
      </div>

      <ChatInput {...inputProps} placeholder="输入你想问的问题..." />
    </div>
  )
}
