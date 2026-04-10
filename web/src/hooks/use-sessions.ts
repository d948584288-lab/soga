"use client"

import { useState, useEffect, useRef } from "react"
import { Session } from "@/types"
import { chatApi } from "@/lib/api-client"

interface UseSessionsOptions {
  pageSize?: number
}

export function useSessions(options: UseSessionsOptions = {}) {
  const { pageSize = 20 } = options
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const isFetching = useRef(false)

  // 获取会话列表
  const fetchSessions = async (pageNum: number, append: boolean) => {
    if (isFetching.current) return
    isFetching.current = true
    
    setIsLoading(true)
    try {
      const data = await chatApi.getSessions(pageNum, pageSize)
      const newSessions = data.items || []
      const total = data.total || 0
      
      setSessions(prev => append ? [...prev, ...newSessions] : newSessions)
      setHasMore(pageNum * pageSize < total)
      setPage(pageNum)
    } catch (err) {
      console.error("Failed to fetch sessions:", err)
    } finally {
      setIsLoading(false)
      isFetching.current = false
    }
  }

  // 初始加载 - 只在组件挂载时执行
  useEffect(() => {
    fetchSessions(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 加载更多
  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchSessions(page + 1, true)
    }
  }

  // 删除会话
  const deleteSession = async (sessionId: string) => {
    try {
      await chatApi.deleteSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err) {
      console.error("Failed to delete session:", err)
    }
  }

  // 刷新列表
  const refresh = () => {
    fetchSessions(1, false)
  }

  return {
    sessions,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    deleteSession,
  }
}
