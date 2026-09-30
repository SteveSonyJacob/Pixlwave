import type { ComponentProps, ReactNode } from "react";

type FieldProps = { id: string; label: string; hint?: string; error?: string };

function FieldFrame({ id, label, hint, error, children }: FieldProps & { children: ReactNode }) {
  return <div className="ui-field"><label htmlFor={id}>{label}</label>{children}{hint ? <p className="ui-field-hint" id={`${id}-hint`}>{hint}</p> : null}{error ? <p className="ui-field-error" id={`${id}-error`}>{error}</p> : null}</div>;
}

function describedBy(id: string, hint?: string, error?: string, additional?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`, additional].filter(Boolean).join(" ") || undefined;
}

export function TextField({ id, label, hint, error, className = "", "aria-describedby": additional, ...props }: ComponentProps<"input"> & FieldProps) {
  return <FieldFrame id={id} label={label} hint={hint} error={error}><input {...props} id={id} className={`ui-input ${className}`} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy(id, hint, error, additional)} /></FieldFrame>;
}

export function SelectField({ id, label, hint, error, children, className = "", "aria-describedby": additional, ...props }: ComponentProps<"select"> & FieldProps) {
  return <FieldFrame id={id} label={label} hint={hint} error={error}><select {...props} id={id} className={`ui-input ${className}`} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy(id, hint, error, additional)}>{children}</select></FieldFrame>;
}

export function TextAreaField({ id, label, hint, error, className = "", "aria-describedby": additional, ...props }: ComponentProps<"textarea"> & FieldProps) {
  return <FieldFrame id={id} label={label} hint={hint} error={error}><textarea {...props} id={id} className={`ui-input ui-textarea ${className}`} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy(id, hint, error, additional)} /></FieldFrame>;
}

export function CheckboxField({ id, label, hint, error, className = "", "aria-describedby": additional, ...props }: ComponentProps<"input"> & FieldProps) {
  return <div className="ui-checkbox-field"><label htmlFor={id}><input {...props} id={id} type="checkbox" className={className} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy(id, hint, error, additional)} /><span>{label}</span></label>{hint ? <p className="ui-field-hint" id={`${id}-hint`}>{hint}</p> : null}{error ? <p className="ui-field-error" id={`${id}-error`}>{error}</p> : null}</div>;
}
