"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { ChatInput } from "@/components/chat/ChatInput"

export default function NewChatPage() {
  const router = useRouter()
  const [inputValue, setInputValue] = useState("")
  
  const {
    selectedModel,
    sendMessage,
    state,
    stop,
  } = useChat({
    onSessionCreated: (session) => {
      router.push(`/chat/${session.id}`)
    },
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  const isLoading = state === "loading" || state === "streaming"

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return
    await sendMessage(value)
  }

  const suggestions = [
    { icon: "📝", title: "帮我写代码", desc: "编写 Python、JavaScript 等语言的代码片段" },
    { icon: "💡", title: "头脑风暴", desc: "激发创意，获得新想法和建议" },
    { icon: "📚", title: "解释概念", desc: "深入浅出地解释复杂概念" },
    { icon: "🔧", title: "调试问题", desc: "分析错误并提供解决方案" },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Soga AI
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            你的智能助手，随时为你服务
          </p>
        </motion.div>

        {/* 快捷功能 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
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
                setInputValue(prompts[item.title] || "")
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

        {/* 输入框 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={stop}
            isLoading={state === "loading"}
            isStreaming={state === "streaming"}
            placeholder="输入你想问的问题..."
          />
        </motion.div>
      </div>
    </div>
  )
}
