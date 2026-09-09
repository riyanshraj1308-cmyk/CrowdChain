import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";

function FieldShell({ label, helperText, error, required, children, id }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-900">
          {label}
          {required && <span className="ml-0.5 text-copper-500" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-rust-500" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-ink-500">{helperText}</p>
      ) : null}
    </div>
  );
}

const baseFieldClasses =
  "h-11 w-full rounded-md border bg-paper-50 px-3.5 text-base text-ink-950 placeholder:text-ink-400 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef(function Input(
  { label, helperText, error, required, className = "", id: idProp, ...props },
  ref
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  return (
    <FieldShell label={label} helperText={helperText} error={error} required={required} id={id}>
      <input
        id={id}
        ref={ref}
        required={required}
        aria-invalid={Boolean(error)}
        className={`${baseFieldClasses} ${
          error ? "border-rust-400 focus:shadow-focus" : "border-ink-950/15 focus:border-copper-500 focus:shadow-focus"
        } ${className}`}
        {...props}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, helperText, error, required, className = "", id: idProp, rows = 5, ...props },
  ref
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  return (
    <FieldShell label={label} helperText={helperText} error={error} required={required} id={id}>
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        className={`${baseFieldClasses} h-auto resize-y py-3 ${
          error ? "border-rust-400 focus:shadow-focus" : "border-ink-950/15 focus:border-copper-500 focus:shadow-focus"
        } ${className}`}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  { label, helperText, error, required, className = "", id: idProp, children, ...props },
  ref
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  return (
    <FieldShell label={label} helperText={helperText} error={error} required={required} id={id}>
      <select
        id={id}
        ref={ref}
        required={required}
        aria-invalid={Boolean(error)}
        className={`${baseFieldClasses} ${
          error ? "border-rust-400 focus:shadow-focus" : "border-ink-950/15 focus:border-copper-500 focus:shadow-focus"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});
