"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Checkbox } from "@/components/ui/Checkbox"
import { useAuth } from "@/context/AuthContext"

interface LoginFormProps {
  onSuccess: () => void
  onRegister: () => void
  onForgot: () => void
}

export function LoginForm({ onSuccess, onRegister, onForgot }: LoginFormProps) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    remember: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登录失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={formData.remember}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, remember: checked as boolean })
            }
          />
          <Label htmlFor="remember" className="text-sm font-normal">
            记住我
          </Label>
        </div>
        <button
          type="button"
          onClick={onForgot}
          className="text-sm text-blue-600 hover:underline"
        >
          忘记密码？
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "登录中..." : "登录"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        还没有账号？
        <button
          type="button"
          onClick={onRegister}
          className="text-blue-600 hover:underline ml-1"
        >
          立即注册
        </button>
      </p>
    </form>
  )
}
