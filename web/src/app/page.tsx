"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    router.replace(user ? "/app" : "/login");
  }, [isReady, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--surface-hover)]" />
    </div>
  );
}
