import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />
      </div>
      <div className="absolute right-4 top-4 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>
      <div className="relative z-[1] flex min-h-screen flex-col items-center justify-center px-4 py-16">
        {children}
      </div>
    </div>
  );
}
