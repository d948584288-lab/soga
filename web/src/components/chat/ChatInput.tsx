"use client"

import { useRef, KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { Send, Square } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"
import { cn } from "@/lib/Utils"

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onStop?: () => void
  isLoading?: boolean
  isStreaming?: boolean
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  isStreaming = false,
  placeholder = "输入消息...",
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading && !disabled) {
        onSubmit(value)
      }
    }
  }

  const handleSubmit = () => {
    if (value.trim() && !isLoading && !disabled) {
      onSubmit(value)
    }
  }

  // 自动调整高度
  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const maxHeight = 200
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border bg-white dark:bg-gray-900",
          "border-gray-200 dark:border-gray-700",
          "shadow-sm hover:shadow-md transition-shadow",
          "focus-within:border-gray-300 dark:focus-within:border-gray-600",
          "focus-within:ring-2 focus-within:ring-gray-100 dark:focus-within:ring-gray-800",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            adjustHeight()
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "min-h-[52px] max-h-[200px] resize-none",
            "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
            "px-4 py-3.5 text-base",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500"
          )}
          rows={1}
        />
        
        <div className="flex-shrink-0 p-2">
          {isStreaming ? (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={onStop}
                className="h-8 w-8 rounded-xl border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="default"
                size="icon"
                onClick={handleSubmit}
                disabled={!value.trim() || isLoading || disabled}
                className={cn(
                  "h-8 w-8 rounded-xl",
                  value.trim() && !isLoading && !disabled
                    ? "bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200"
                    : "bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4 text-white dark:text-gray-900" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* 提示文字 */}
      <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
        按 Enter 发送，Shift + Enter 换行
      </div>
    </div>
  )
}
