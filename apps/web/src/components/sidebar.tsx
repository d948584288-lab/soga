"use client";

import {
  LogOut,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeft,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const PLACEHOLDER_CHATS = [
  { id: "1", title: "产品需求梳理" },
  { id: "2", title: "SQL 查询优化建议" },
  { id: "3", title: "周报草稿" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className="flex h-14 items-center gap-2 px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/90 to-teal-600/90 text-white shadow-sm">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-[var(--foreground)]">
                Workspace
              </p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                企业助手
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>

      <div className="px-3 pb-2">
        <Link href="/app" className="block">
          <Button
            variant="secondary"
            className={cn(
              "w-full justify-start gap-2 rounded-xl",
              collapsed && "justify-center px-0",
            )}
          >
            <MessageSquarePlus className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>新建对话</span>}
          </Button>
        </Link>
      </div>

      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              readOnly
              placeholder="搜索对话"
              className="h-10 w-full cursor-default rounded-xl border border-[var(--border)] bg-[var(--input-bg)] pl-9 pr-3 text-sm text-[var(--muted-foreground)] placeholder:text-[var(--muted-foreground)]"
              aria-label="搜索对话（占位）"
            />
          </div>
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {!collapsed && (
          <>
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              近期对话
            </p>
            <ul className="space-y-0.5">
              {PLACEHOLDER_CHATS.map((chat) => {
                const active = pathname === `/app/c/${chat.id}`;
                return (
                  <li key={chat.id}>
                    <Link
                      href={`/app/c/${chat.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-[var(--surface-hover)] text-[var(--foreground)]"
                          : "text-[var(--foreground)]/85 hover:bg-[var(--surface-hover)]",
                      )}
                    >
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] p-3">
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed ? "flex-col" : "flex-row",
          )}
        >
          <ThemeToggle />
          {!collapsed && (
            <div className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2">
              <p className="truncate text-xs font-medium text-[var(--foreground)]">
                {user?.displayName ?? "用户"}
              </p>
              <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                {user?.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              collapsed ? "h-9 w-9 px-0" : "px-3",
            )}
            onClick={() => logout()}
            aria-label="退出登录"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {!collapsed && <span className="ml-1">退出</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
