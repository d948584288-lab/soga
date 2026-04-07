"use client";

import { useAuth } from "@/contexts/auth-context";

export default function AppHomePage() {
  const { user } = useAuth();

  return (
    <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[min(520px,70vh)] w-[min(520px,70vh)] rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl dark:from-emerald-400/10" />
      </div>
      <div className="relative z-[1] max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-4xl">
          今天有什么可以帮你的吗？
        </h1>
        <p className="mt-3 text-base text-[var(--muted-foreground)]">
          你好，{user?.displayName}。主对话区与 API 将在后续迭代接入；当前为布局与主题基线。
        </p>
        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left text-sm text-[var(--muted-foreground)] shadow-sm">
            <p className="font-medium text-[var(--foreground)]">输入框占位</p>
            <p className="mt-1">
              底部 composer、附件与模型选择将在接入对话能力时补齐。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
