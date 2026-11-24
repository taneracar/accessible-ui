import type { ComponentProps, MouseEvent } from "react";
import { cx } from "../internal/cx";

export interface ButtonProps extends Omit<ComponentProps<"button">, "disabled"> {
  variant?: "primary" | "secondary" | "danger";
  /**
   * Unavailable, but still focusable, so a keyboard user can reach it and hear
   * why (pair it with aria-describedby). Clicks and form submits are blocked.
   */
  unavailable?: boolean;
}

export function Button({ variant = "primary", unavailable = false, className, onClick, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-disabled={unavailable || undefined}
      className={cx("aui-button", `aui-button--${variant}`, className)}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (unavailable) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
