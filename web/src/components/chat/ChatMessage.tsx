"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Copy, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback } from "@/components/ui/Avatar"
import { Markdown } from "@/components/ui/Markdown"
import { Message } from "@/types"
import { cn } from "@/lib/Utils"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
  isLast?: boolean
  onRegenerate?: () => void
}

export function ChatMessage({
  message,
  isStreaming = false,
  isLast = false,
  onRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div
      className={cn(
        "group py-6",
        isUser ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-[#1a1a1a]"
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* 头像 */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          {isUser ? (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
              我
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm">
              AI
            </AvatarFallback>
          )}
        </Avatar>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
            {isUser ? "你" : "Soga"}
          </div>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <Markdown content={message.content} />
            {isStreaming && (
              <motion.span
                className="inline-block w-2 h-4 bg-emerald-500 ml-1 align-middle"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>

          {/* 工具栏 */}
          {!isUser && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                {copied ? "已复制" : "复制"}
              </Button>
              
              {isLast && onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-7 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  重新生成
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
