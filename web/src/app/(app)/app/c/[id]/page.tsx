"use client";

import { useParams } from "next/navigation";

export default function ConversationPlaceholderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "—";

  return (
    <main className="flex min-h-0 flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          对话
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          会话占位 · {id}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          此路由与侧边栏中的示例条目对应。接入后端后，这里将渲染消息列表与输入区。
        </p>
        <div className="mt-10 min-h-[240px] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-elevated)]/50 p-6 text-sm text-[var(--muted-foreground)]">
          消息时间线占位
        </div>
      </div>
    </main>
  );
}
