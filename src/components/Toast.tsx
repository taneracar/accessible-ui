import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";

export interface ToastOptions {
  message: string;
  kind?: "info" | "error";
  /** ms before it goes away. Errors stay until dismissed, whatever this says. */
  duration?: number;
}
interface ToastEntry extends ToastOptions { id: number }

const ToastContext = createContext<((t: ToastOptions) => void) | null>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);
  const region = useRef<HTMLElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const show = useCallback((t: ToastOptions) => {
    const id = nextId.current++;
    setToasts((all) => [...all, { ...t, id }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    // Removing the focused button would drop focus to <body>. Give it back.
    const hadFocus = region.current?.querySelector(`[data-toast="${id}"]`)?.contains(document.activeElement);
    setToasts((all) => all.filter((t) => t.id !== id));
    if (hadFocus && returnTo.current?.isConnected) returnTo.current.focus();
  }, []);

  const list = (kind: "info" | "error") =>
    toasts.filter((t) => (t.kind ?? "info") === kind).map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />);

  return (
    <ToastContext value={show}>
      {children}
      <section
        ref={region}
        aria-label="Notifications"
        className="aui-toasts"
        onFocus={(e) => {
          const from = e.relatedTarget;
          if (from instanceof HTMLElement && !e.currentTarget.contains(from)) returnTo.current = from;
        }}
      >
        {/* Both live regions exist before the first message, or it may not be announced. */}
        <div role="status" aria-atomic="false">{list("info")}</div>
        <div role="alert" aria-atomic="false">{list("error")}</div>
      </section>
    </ToastContext>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: (id: number) => void }) {
  const { id, kind = "info", duration = 6000, message } = toast;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  useEffect(() => {
    if (kind === "error" || paused) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [kind, paused, duration, id, onDismiss]);

  return (
    <div
      data-toast={id}
      className={`aui-toast aui-toast--${kind}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <span>{message}</span>
      <Button variant="secondary" aria-label={`Dismiss: ${message}`} onClick={() => onDismiss(id)}>Dismiss</Button>
    </div>
  );
}
