import { useId, type ComponentProps } from "react";
import { cx } from "../internal/cx";

export interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  /** Required: a placeholder is not a label. */
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, className, required, "aria-describedby": describedBy, ...rest }: TextFieldProps) {
  const id = useId();
  const ids = [describedBy, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  return (
    <div className="aui-field">
      <label className="aui-label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> (required)</span>}
      </label>
      {hint && <div className="aui-hint" id={`${id}-hint`}>{hint}</div>}
      <input
        {...rest}
        id={id}
        required={required}
        className={cx("aui-input", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids || undefined}
      />
      {error && <div className="aui-error" id={`${id}-error`}>Error: {error}</div>}
    </div>
  );
}
