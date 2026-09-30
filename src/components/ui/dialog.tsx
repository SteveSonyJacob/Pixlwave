"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

export function Dialog({ open, title, description, children, onClose }: { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="ui-dialog" aria-labelledby="ui-dialog-title" aria-describedby={description ? "ui-dialog-description" : undefined} onCancel={(event) => { event.preventDefault(); onClose(); }} onClose={onClose}>
    <div className="ui-dialog-header"><div><h2 id="ui-dialog-title">{title}</h2>{description ? <p id="ui-dialog-description">{description}</p> : null}</div><Button variant="ghost" size="sm" aria-label="Close dialog" onClick={onClose}>×</Button></div>
    <div className="ui-dialog-body">{children}</div>
  </dialog>;
}
