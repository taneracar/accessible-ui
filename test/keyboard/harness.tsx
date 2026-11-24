import "../../src/styles.css";
import type { ReactNode } from "react";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

/**
 * Keys go through the DevTools protocol, so Tab order, native <dialog> Escape
 * handling and inertness are the browser's own, not a simulation of them.
 */
export const press = (keys: string) => userEvent.keyboard(keys);
export const focused = () => document.activeElement as HTMLElement;
export const name = () => focused().textContent?.trim() || focused().getAttribute("aria-label") || focused().tagName;

/** Wraps the subject with a button before and after it, to observe focus entering and leaving. */
export async function mount(ui: ReactNode) {
  const screen = await render(<><button>before</button>{ui}<button>after</button></>);
  (screen.getByRole("button", { name: "before" }).element() as HTMLElement).focus();
  return screen;
}
