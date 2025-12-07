import { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Badge({ children, variant = "default", size = "md", className = "" }: BadgeProps) {
  return <span className={`badge badge-${variant} badge-${size} ${className}`}>{children}</span>;
}
