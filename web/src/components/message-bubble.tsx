"use client"

import * as React from "react"
import { User, Bot } from "lucide-react"
import { cn } from "@/lib/Utils"
import { MarkdownRenderer } from "./markdown-renderer"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex gap-4 py-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-green-600 text-white"
        )}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* 内容 */}
      <div
        className={cn(
          "flex-1 max-w-3xl",
          isUser ? "text-right" : "text-left"
        )}
      >
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-3 text-left",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <>
              <MarkdownRenderer content={content} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
