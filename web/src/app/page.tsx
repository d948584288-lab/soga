"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 默认进入对话页
    router.replace("/chat");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="h-9 w-9 animate-pulse rounded-full bg-blue-600" />
    </div>
  );
}
