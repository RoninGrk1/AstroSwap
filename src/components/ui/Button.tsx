import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "btn-glow bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white hover:brightness-110 disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100",
  secondary:
    "bg-white/8 text-white hover:bg-white/12 border border-white/10",
  ghost: "bg-transparent text-white/80 hover:bg-white/5 hover:text-white",
  danger:
    "bg-rose-500/20 text-rose-200 border border-rose-500/30 hover:bg-rose-500/30",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed active:scale-[0.99] disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
