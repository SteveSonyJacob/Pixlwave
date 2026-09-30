"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./button";

export function SubmitButton({ children, pendingLabel = "Saving…", disabled, ...props }: Omit<ComponentProps<typeof Button>, "type"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <Button {...props} type="submit" disabled={disabled || pending} aria-busy={pending}>{pending ? pendingLabel : children}</Button>;
}
