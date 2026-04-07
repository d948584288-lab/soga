"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { GuestGate } from "@/components/guest-gate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    login({
      email: values.email.trim(),
      displayName: values.email.split("@")[0] || "用户",
    });
    router.push("/app");
  });

  return (
    <GuestGate>
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/90 to-teal-600/90 text-white shadow-md">
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            欢迎回来
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            登录以继续使用 Soga（当前为前端会话占位，后续接入 API）
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]/80 p-6 shadow-sm backdrop-blur-sm dark:bg-[var(--surface-elevated)]/60">
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mt-1.5 text-xs text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="至少 8 位字符"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="mt-1.5 text-xs text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              继续
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          还没有账户？{" "}
          <Link
            href="/register"
            className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
          >
            注册
          </Link>
        </p>
      </div>
    </GuestGate>
  );
}
