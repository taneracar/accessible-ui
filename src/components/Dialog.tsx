import { useEffect, useId, useRef, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  /** "alertdialog" also turns off closing by backdrop click. */
  role?: "dialog" | "alertdialog";
}

/**
 * Built on <dialog>.showModal(): the browser makes the rest of the page inert and
 * owns the top layer. This adds naming, controlled state and focus return.
 */
export function Dialog({ open, onClose, title, description, children, actions, role = "dialog" }: DialogProps) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    const opener = document.activeElement;
    el.showModal();
    return () => {
      el.close();
      // The browser restores focus itself, unless React unmounted the dialog first.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;
  const onBackdrop = (e: React.MouseEvent) => e.target === ref.current && isOutside(e, ref.current!);
  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      className="aui-dialog"
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return; // e.g. a cancelled file picker inside
        // Escape: let the parent decide, so `open` stays the single source of truth.
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        // Chrome force-closes on a second Escape even if cancel was prevented.
        // defaultPrevented means an inner widget (menu, combobox) already used it.
        if (e.key === "Escape" && !e.defaultPrevented) {
          e.preventDefault();
          onClose();
        }
      }}
      onMouseDown={(e) => { pressedBackdrop.current = onBackdrop(e); }}
      onClick={(e) => {
        // Press and release must both be outside: dragging a text selection out must not close it.
        if (role === "dialog" && pressedBackdrop.current && onBackdrop(e)) onClose();
      }}
    >
      <h2 id={`${id}-title`} className="aui-dialog__title">{title}</h2>
      {description && <p id={`${id}-desc`}>{description}</p>}
      {children}
      {actions && <div className="aui-dialog__actions">{actions}</div>}
    </dialog>
  );
}

function isOutside(e: React.MouseEvent, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}
