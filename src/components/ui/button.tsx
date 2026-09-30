import Link from "next/link";
import type { ComponentProps } from "react";

type Appearance = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  fullWidth?: boolean;
};

export function Button({ variant = "primary", size = "md", fullWidth, className = "", type = "button", ...props }: ComponentProps<"button"> & Appearance) {
  return <button className={`ui-button ${className}`} data-variant={variant} data-size={size} data-full-width={fullWidth} type={type} {...props} />;
}

export function LinkButton({ variant = "primary", size = "md", fullWidth, className = "", ...props }: ComponentProps<typeof Link> & Appearance) {
  return <Link className={`ui-button ${className}`} data-variant={variant} data-size={size} data-full-width={fullWidth} {...props} />;
}
