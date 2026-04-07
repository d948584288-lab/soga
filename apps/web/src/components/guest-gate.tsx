"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function GuestGate({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (user) {
      router.replace("/app");
    }
  }, [isReady, user, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--surface-hover)]" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
