"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import { ForgotPasswordForm } from "./ForgotPasswordForm"

type AuthView = "login" | "register" | "forgot"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: AuthView
}

export function AuthModal({ open, onOpenChange, defaultView = "login" }: AuthModalProps) {
  const [view, setView] = React.useState<AuthView>(defaultView)

  const titles = {
    login: "登录",
    register: "注册账号",
    forgot: "找回密码",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{titles[view]}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {view === "login" && (
            <LoginForm
              onSuccess={() => onOpenChange(false)}
              onRegister={() => setView("register")}
              onForgot={() => setView("forgot")}
            />
          )}
          {view === "register" && (
            <RegisterForm
              onSuccess={() => onOpenChange(false)}
              onLogin={() => setView("login")}
            />
          )}
          {view === "forgot" && (
            <ForgotPasswordForm onBack={() => setView("login")} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
