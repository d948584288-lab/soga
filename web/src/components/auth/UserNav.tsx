"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Avatar, AvatarFallback } from "@/components/ui/Avatar"
import { useAuth } from "@/context/AuthContext"
import { AuthModal } from "./AuthModal"
import { User, LogOut, Settings, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"

interface UserNavProps {
  collapsed?: boolean
}

export function UserNav({ collapsed }: UserNavProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showAuthModal, setShowAuthModal] = React.useState(false)

  const getInitials = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase()
    return user?.email.charAt(0).toUpperCase() || "U"
  }

  const getDisplayName = () => {
    return user?.displayName || user?.email?.split("@")[0] || "用户"
  }

  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setShowAuthModal(true)}
        >
          <User className="h-4 w-4" />
          {!collapsed && "登录 / 注册"}
        </Button>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-2 px-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{getDisplayName()}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {theme === "dark" ? "切换到浅色" : "切换到深色"}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            设置
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
