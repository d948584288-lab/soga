"use client"

import { useMemo, useCallback } from "react"
import { Plus, PanelLeft, MessageSquare, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ScrollArea } from "@/components/ui/ScrollArea"
import { UserNav } from "@/components/auth/UserNav"
import { Session } from "@/types"
import { cn } from "@/lib/Utils"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNewChat: () => void
  sessions: Session[]
  currentSessionId: string | null
  onSelectSession: (session: Session) => void
  onDeleteSession: (sessionId: string) => void
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function Sidebar({
  collapsed,
  onToggle,
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  isLoading,
  hasMore,
  onLoadMore,
}: SidebarProps) {
  // 按时间分组会话
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: Session[] } = {
      "今天": [],
      "昨天": [],
      "7天内": [],
      "更早": [],
    }

    // 防御性检查
    if (!Array.isArray(sessions)) {
      return groups
    }

    const now = new Date()
    
    sessions.forEach((session) => {
      const date = new Date(session.updatedAt)
      const diffTime = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        groups["今天"].push(session)
      } else if (diffDays === 1) {
        groups["昨天"].push(session)
      } else if (diffDays <= 7) {
        groups["7天内"].push(session)
      } else {
        groups["更早"].push(session)
      }
    })

    return groups
  }, [sessions])

  // 监听滚动到底部
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    
    // 距离底部 100px 时加载更多
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoading && onLoadMore) {
      onLoadMore()
    }
  }, [hasMore, isLoading, onLoadMore])

  if (collapsed) {
    return (
      <div className="w-16 h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#171717] flex flex-col">
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {(sessions || []).slice(0, 5).map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={cn(
                "w-full p-2 rounded-lg text-left text-sm truncate transition-colors",
                currentSessionId === session.id
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
              )}
              title={session.title}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <UserNav collapsed={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#171717] flex flex-col">
      {/* 顶部操作栏 */}
      <div className="p-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          className="flex-1 justify-start gap-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          新聊天
        </Button>
      </div>

      {/* 会话列表 */}
      <ScrollArea 
        className="flex-1 px-2" 
        onScroll={handleScroll}
      >
        <div className="space-y-4 py-2">
          {Object.entries(groupedSessions).map(
            ([groupName, groupSessions]) =>
              groupSessions.length > 0 && (
                <div key={groupName}>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1 px-2">
                    {groupName}
                  </h3>
                  <div className="space-y-0.5">
                    {groupSessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "group flex items-center rounded-lg transition-colors",
                          currentSessionId === session.id
                            ? "bg-gray-200 dark:bg-gray-800"
                            : "hover:bg-gray-200 dark:hover:bg-gray-800"
                        )}
                      >
                        <button
                          onClick={() => onSelectSession(session)}
                          className={cn(
                            "flex-1 flex items-center gap-2 px-2 py-2 text-left text-sm truncate",
                            currentSessionId === session.id
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-500" />
                          <span className="truncate">{session.title || "新会话"}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteSession(session.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
          
          {/* 加载更多指示器 */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}
          
          {!hasMore && sessions.length > 0 && (
            <div className="text-center py-4 text-xs text-gray-400">
              没有更多会话了
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 底部用户信息 */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <UserNav collapsed={false} />
      </div>
    </div>
  )
}
