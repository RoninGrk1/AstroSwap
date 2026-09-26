import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-card rounded-2xl sm:rounded-3xl ${className}`}>
      {children}
    </div>
  );
}
