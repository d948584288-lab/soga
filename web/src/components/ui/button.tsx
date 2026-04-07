import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
          {
            primary:
              "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
            secondary:
              "bg-[var(--surface-elevated)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)]",
            ghost:
              "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
            outline:
              "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
          }[variant],
          {
            sm: "h-9 px-3 text-sm",
            md: "h-11 px-4 text-sm",
            lg: "h-12 px-5 text-base",
          }[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
