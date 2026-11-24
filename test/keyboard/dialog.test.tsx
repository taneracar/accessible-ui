import { useState } from "react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Button, Combobox, Dialog, Menu } from "../../src/index";
import { mount, name, press } from "./harness";

function Demo({ children, onClose, role }: { children?: React.ReactNode; onClose?: () => void; role?: "dialog" | "alertdialog" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>open</Button>
      <Dialog open={open} onClose={() => { onClose?.(); setOpen(false); }} title="Title" description="Why" role={role}>
        <Button>inside</Button>{children}
      </Dialog>
    </>
  );
}

test("opens, focuses inside, closes on Escape, returns focus", async () => {
  const close = vi.fn();
  const s = await mount(<Demo onClose={close} />);
  await press("{Tab}{Enter}");
  expect(name()).toBe("inside");
  const d = s.getByRole("dialog");
  await expect.element(d).toHaveAccessibleName("Title");
  await expect.element(d).toHaveAccessibleDescription("Why");
  await press("{Escape}");
  await expect.element(d).not.toBeInTheDocument();
  expect(name()).toBe("open");
  expect(close).toHaveBeenCalledTimes(1);
});

test("Tab never reaches the page behind", async () => {
  await mount(<Demo />);
  await press("{Tab}{Enter}");
  const seen = new Set<string>();
  for (let i = 0; i < 6; i++) { await press("{Tab}"); seen.add(name()); }
  expect(seen).not.toContain("before");
  expect(seen).not.toContain("after");
  expect(seen).toContain("inside");
});

test("when the parent refuses to close, repeated Escape cannot force it", async () => {
  const s = await mount(<Dialog open onClose={() => {}} title="Unsaved"><Button>inside</Button></Dialog>);
  await press("{Escape}{Escape}{Escape}");
  expect((s.getByRole("dialog").element() as HTMLDialogElement).open).toBe(true);
});

test("Escape closes an inner combobox list first, the dialog second", async () => {
  const s = await mount(<Demo><Combobox label="City" options={[{ value: "a", label: "Ankara" }]} value={null} onChange={() => {}} /></Demo>);
  await press("{Tab}{Enter}{Tab}{ArrowDown}");
  await expect.element(s.getByRole("listbox")).toBeVisible();
  await press("{Escape}");
  await expect.element(s.getByRole("listbox")).not.toBeInTheDocument();
  await expect.element(s.getByRole("dialog")).toBeVisible();
  await press("{Escape}");
  await expect.element(s.getByRole("dialog")).not.toBeInTheDocument();
});

test("Escape closes an inner menu first", async () => {
  const s = await mount(<Demo><Menu label="More" items={[{ id: "a", label: "A", onSelect: () => {} }]} /></Demo>);
  await press("{Tab}{Enter}{Tab}{Enter}");
  await expect.element(s.getByRole("menu")).toBeVisible();
  await press("{Escape}");
  await expect.element(s.getByRole("menu")).not.toBeInTheDocument();
  await expect.element(s.getByRole("dialog")).toBeVisible();
});

test.each([["dialog", 1], ["alertdialog", 0]] as const)("backdrop click on %s closes %i time(s)", async (role, times) => {
  const close = vi.fn();
  const s = await mount(<Demo role={role} onClose={close} />);
  await press("{Tab}{Enter}");
  await expect.element(s.getByRole(role)).toBeVisible();
  await userEvent.click(page.elementLocator(document.documentElement), { position: { x: 2, y: 2 }, force: true });
  expect(close).toHaveBeenCalledTimes(times);
});

test("pressing inside and releasing on the backdrop does not close", async () => {
  const close = vi.fn();
  const s = await mount(<Demo onClose={close} />);
  await press("{Tab}{Enter}");
  const d = s.getByRole("dialog").element();
  const opts = { bubbles: true, cancelable: true };
  s.getByText("Why").element().dispatchEvent(new MouseEvent("mousedown", { ...opts, clientX: 200, clientY: 200 }));
  d.dispatchEvent(new MouseEvent("click", { ...opts, clientX: 1, clientY: 1 }));
  expect(close).not.toHaveBeenCalled();
});

test("a menu action that opens a dialog keeps focus in the dialog", async () => {
  function Flow() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Menu label="Actions" items={[{ id: "d", label: "Delete", onSelect: () => setOpen(true) }]} />
        <Dialog open={open} onClose={() => setOpen(false)} title="Sure?"><Button>inside</Button></Dialog>
      </>
    );
  }
  await mount(<Flow />);
  await press("{Tab}{Enter}");
  await press("{Enter}");
  expect(name()).toBe("inside");
  await press("{Escape}");
  expect(name()).toContain("Actions"); // not <body>: the menu item that was used is gone
});
