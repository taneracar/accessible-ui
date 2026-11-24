import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { moveIndex, typeahead } from "../internal/nav";
import { Button } from "./Button";

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const initial = useRef<"first" | "last">("first");
  const typed = useRef({ text: "", at: 0 });
  const disabled = items.map((i) => !!i.disabled);

  useEffect(() => {
    if (!open) return;
    refs.current[moveIndex(initial.current, -1, disabled)]?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
    // Only on open: item updates while open must not steal focus.
  }, [open]);

  const openAt = (where: "first" | "last") => {
    initial.current = where;
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const choose = (item: MenuItem) => {
    if (item.disabled) return;
    // Close first, so that an action which moves focus (opening a dialog) wins.
    close();
    item.onSelect();
  };
  const onItemKey = (e: KeyboardEvent, index: number) => {
    if (e.key === "Tab") return setOpen(false);
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const move = ({ ArrowDown: "next", ArrowUp: "prev", Home: "first", End: "last" } as const)[e.key];
    if (move) {
      e.preventDefault();
      refs.current[moveIndex(move, index, disabled)]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(items[index]!);
    } else if (e.key.length === 1) {
      const now = e.timeStamp;
      const text = now - typed.current.at < 500 ? typed.current.text + e.key : e.key;
      typed.current = { text, at: now };
      refs.current[typeahead(text, index, items.map((i) => i.label), disabled)]?.focus();
    }
  };

  return (
    <div ref={root} className="aui-menu-root">
      <Button
        ref={trigger}
        id={`${id}-button`}
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => (open ? close() : openAt("first"))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openAt(e.key === "ArrowDown" ? "first" : "last");
          }
        }}
      >
        {label} <span aria-hidden="true">▾</span>
      </Button>
      {open && (
        <ul role="menu" id={`${id}-menu`} aria-labelledby={`${id}-button`} className="aui-menu">
          {items.map((item, i) => (
            <li
              key={item.id}
              ref={(el) => { refs.current[i] = el; }}
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled || undefined}
              className="aui-menuitem"
              onClick={() => choose(item)}
              onKeyDown={(e) => onItemKey(e, i)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
