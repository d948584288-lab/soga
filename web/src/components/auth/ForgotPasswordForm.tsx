"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // 预留功能
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="font-medium">功能开发中</h3>
          <p className="text-sm text-muted-foreground mt-1">
            密码重置功能即将上线
          </p>
        </div>
        <Button variant="outline" onClick={onBack} className="w-full">
          返回登录
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/50 rounded-md">
        请输入您的邮箱，我们将向您发送密码重置链接（功能开发中）
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgot-email">邮箱</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "发送中..." : "发送重置链接"}
      </Button>

      <Button type="button" variant="ghost" onClick={onBack} className="w-full">
        ← 返回登录
      </Button>
    </form>
  )
}
