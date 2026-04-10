"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { useAuth } from "@/context/AuthContext"

interface RegisterFormProps {
  onSuccess: () => void
  onLogin: () => void
}

export function RegisterForm({ onSuccess, onLogin }: RegisterFormProps) {
  const { register } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }

    if (formData.password.length < 6) {
      setError("密码至少6位")
      return
    }

    setIsLoading(true)

    try {
      await register(formData.email, formData.password, formData.displayName)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败")
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
        <Label htmlFor="register-email">邮箱</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-name">显示名称（可选）</Label>
        <Input
          id="register-name"
          placeholder="您的名字"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">密码</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">确认密码</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "注册中..." : "注册"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        已有账号？
        <button
          type="button"
          onClick={onLogin}
          className="text-blue-600 hover:underline ml-1"
        >
          立即登录
        </button>
      </p>
    </form>
  )
}
