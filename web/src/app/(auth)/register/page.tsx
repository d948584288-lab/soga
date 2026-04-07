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
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    login({
      email: values.email.trim(),
      displayName: values.displayName.trim(),
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
            创建账户
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            注册信息仅保存在本机会话中，后端接入后将切换为安全认证
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]/80 p-6 shadow-sm backdrop-blur-sm dark:bg-[var(--surface-elevated)]/60">
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                autoComplete="name"
                placeholder="例如：张晨"
                {...form.register("displayName")}
              />
              {form.formState.errors.displayName && (
                <p className="mt-1.5 text-xs text-red-500">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>
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
                autoComplete="new-password"
                placeholder="至少 8 位字符"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="mt-1.5 text-xs text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm">确认密码</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="再次输入密码"
                {...form.register("confirm")}
              />
              {form.formState.errors.confirm && (
                <p className="mt-1.5 text-xs text-red-500">
                  {form.formState.errors.confirm.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              创建账户
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          已有账户？{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
          >
            登录
          </Link>
        </p>
      </div>
    </GuestGate>
  );
}
