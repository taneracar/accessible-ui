import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { moveIndex } from "../internal/nav";

export interface TabsProps {
  label: string;
  tabs: { id: string; title: string; content: ReactNode }[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  /** "manual" when switching is expensive (network): arrows move focus, Enter/Space selects. */
  activation?: "automatic" | "manual";
}

export function Tabs({ label, tabs, defaultTab, onChange, activation = "automatic" }: TabsProps) {
  const base = useId();
  const [selectedId, setSelected] = useState(defaultTab ?? tabs[0]?.id);
  // If the selected tab is removed by the parent, fall back to the first one.
  const selected = tabs.some((t) => t.id === selectedId) ? selectedId : tabs[0]?.id;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (id: string) => {
    if (id === selected) return;
    setSelected(id);
    onChange?.(id);
  };
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const key = ({ ArrowRight: rtl ? "prev" : "next", ArrowLeft: rtl ? "next" : "prev", Home: "first", End: "last" } as const)[e.key];
    if (!key) return;
    e.preventDefault();
    const next = moveIndex(key, index, tabs.map(() => false));
    refs.current[next]?.focus();
    if (activation === "automatic") select(tabs[next]!.id);
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="aui-tablist">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={t.id === selected}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={t.id === selected ? 0 : -1}
            className="aui-tab"
            onClick={() => select(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {t.title}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${base}-panel-${t.id}`} aria-labelledby={`${base}-tab-${t.id}`} hidden={t.id !== selected} tabIndex={0} className="aui-tabpanel">
          {t.content}
        </div>
      ))}
    </div>
  );
}
