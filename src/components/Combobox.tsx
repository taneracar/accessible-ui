import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { moveIndex } from "../internal/nav";

export interface ComboboxOption { value: string; label: string }

export interface ComboboxProps {
  label: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  hint?: string;
}

/**
 * Editable combobox with list autocomplete (WAI-ARIA APG). DOM focus stays in the
 * input; the active option is exposed with aria-activedescendant.
 */
export function Combobox({ label, options, value, onChange, hint }: ComboboxProps) {
  const id = useId();
  const selected = options.find((o) => o.value === value);
  const [query, setQuery] = useState<string | null>(null); // null: not editing, show the selected label
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);

  const text = query ?? selected?.label ?? "";
  const matches = query ? options.filter((o) => fold(o.label).includes(fold(query.trim()))) : options;
  // Options can shrink while open (async data), so never point at a missing one.
  const activeIndex = active < matches.length ? active : -1;

  useEffect(() => {
    if (open && activeIndex >= 0) list.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const choose = (o: ComboboxOption) => {
    onChange(o.value);
    setQuery(null);
    close();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    // IME composition (Japanese, Korean...) uses Enter and arrows itself.
    if (e.nativeEvent.isComposing || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        if (e.altKey) return;
      }
      setActive(moveIndex(e.key === "ArrowDown" ? "next" : "prev", activeIndex, matches.map(() => false)));
    } else if (e.key === "Enter" && open && activeIndex >= 0) {
      e.preventDefault(); // do not submit the form while picking
      choose(matches[activeIndex]!);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault(); // consumed here, so a surrounding Dialog stays open
        close();
      } else if (text) {
        e.preventDefault();
        setQuery(null);
        onChange(null);
      }
    } else if (e.key === "Home" || e.key === "End" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
      setActive(-1); // the caret moves, so the option is no longer active
    }
  };

  return (
    <div className="aui-field">
      <label className="aui-label" htmlFor={id} id={`${id}-label`}>{label}</label>
      {hint && <div className="aui-hint" id={`${id}-hint`}>{hint}</div>}
      <div style={{ position: "relative" }}>
        <input
          id={id}
          className="aui-input"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open && matches.length > 0}
          aria-controls={open && matches.length > 0 ? `${id}-list` : undefined}
          aria-activedescendant={open && activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={text}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
            if (e.target.value === "" && value !== null) onChange(null);
          }}
          onBlur={() => {
            // Text that was typed but never chosen is dropped, so what is shown is what is stored.
            setQuery(null);
            close();
          }}
          onKeyDown={onKeyDown}
        />
        {open && matches.length > 0 && (
          <ul ref={list} role="listbox" id={`${id}-list`} aria-labelledby={`${id}-label`} className="aui-listbox">
            {matches.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                data-active={i === activeIndex}
                className="aui-option"
                onPointerDown={(e) => e.preventDefault()} // keep focus (and the list) while clicking
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
              >
                {o.label}
              </li>
            ))}
          </ul>
        )}
        {/* Always mounted: live regions that appear together with their text are often not announced. */}
        <div role="status" className={open && matches.length === 0 ? "aui-hint" : "aui-visually-hidden"}>
          {open && query ? (matches.length === 0 ? "No results" : `${matches.length} ${matches.length === 1 ? "result" : "results"}`) : ""}
        </div>
      </div>
    </div>
  );
}

/** Case- and accent-insensitive, so "sao" finds "São Paulo" and "istanbul" finds "İstanbul". */
function fold(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
