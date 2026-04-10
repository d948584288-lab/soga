"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/chat/Sidebar"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { AuthModal } from "@/components/auth/AuthModal"
import { useAuth } from "@/context/AuthContext"
import { chatApi, llmApi } from "@/lib/api-client"
import { Session, LlmModel } from "@/types"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [models, setModels] = useState<LlmModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("moonshot-v1-32k")
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // 加载会话列表和模型
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions()
      loadModels()
    }
  }, [isAuthenticated])

  // 从 URL 获取当前会话 ID
  useEffect(() => {
    const match = pathname.match(/\/chat\/([^\/]+)/)
    if (match && match[1] !== "new") {
      setCurrentSessionId(match[1])
    }
  }, [pathname])

  const loadSessions = async () => {
    try {
      const { items } = await chatApi.getSessions(1, 100)
      setSessions(items)
    } catch (err) {
      console.error("Failed to load sessions:", err)
    }
  }

  const loadModels = async () => {
    try {
      const { data, default: defaultModel } = await llmApi.getModels()
      setModels(data || [])
      if (defaultModel) {
        setSelectedModel(defaultModel.id)
      }
    } catch (err) {
      console.error("Failed to load models:", err)
    }
  }

  // 新建对话
  const handleNewChat = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      const session = await chatApi.createSession({ model: selectedModel })
      setSessions([session, ...sessions])
      router.push(`/chat/${session.id}`)
    } catch (err) {
      console.error("Failed to create session:", err)
    }
  }

  // 删除会话
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("确定要删除这个会话吗？")) return
    
    try {
      await chatApi.deleteSession(sessionId)
      setSessions(sessions.filter((s) => s.id !== sessionId))
      
      // 如果删除的是当前会话，跳转到空页面
      if (currentSessionId === sessionId) {
        router.push("/chat")
      }
    } catch (err) {
      console.error("Failed to delete session:", err)
    }
  }

  // 选择会话
  const handleSelectSession = (session: Session) => {
    router.push(`/chat/${session.id}`)
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onNewChat={handleNewChat}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
      />
    </div>
  )
}
