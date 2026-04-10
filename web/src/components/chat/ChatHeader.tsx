"use client"

import { PanelLeft, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { LlmModel } from "@/types"

interface ChatHeaderProps {
  models: LlmModel[]
  selectedModel: string
  onSelectModel: (modelId: string) => void
  onNewChat: () => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function ChatHeader({
  models,
  selectedModel,
  onSelectModel,
  onNewChat,
  sidebarCollapsed,
  onToggleSidebar,
}: ChatHeaderProps) {
  const currentModel = models.find((m) => m.id === selectedModel)

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}

        {/* 模型选择器 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {currentModel?.name || "Soga"}
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={model.id === selectedModel ? "bg-gray-100 dark:bg-gray-800" : ""}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-gray-500">
                    {model.provider} · {model.contextWindow.toLocaleString()} tokens
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="hidden sm:flex items-center gap-1 text-gray-600 dark:text-gray-300"
        >
          <Plus className="h-4 w-4" />
          新聊天
        </Button>
      </div>
    </header>
  )
}
