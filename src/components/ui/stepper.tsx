"use client";

export function Stepper({ items, current, onStepChange, disabled }: { items: readonly string[]; current: number; onStepChange?: (index: number) => void; disabled?: boolean }) {
  return <nav aria-label="Progress"><ol className="ui-stepper">{items.map((label, index) => <li key={label} data-state={index < current ? "complete" : index === current ? "current" : "upcoming"}><button type="button" disabled={disabled || index > current || !onStepChange} aria-current={index === current ? "step" : undefined} onClick={() => onStepChange?.(index)}><span>{index < current ? "✓" : index + 1}</span><b>{label}</b></button></li>)}</ol></nav>;
}
