import { useState } from "react";
import { expect, test, vi } from "vitest";
import { Combobox } from "../../src/index";
import { CITIES } from "../../src/stories/data";
import { focused, mount, name, press } from "./harness";

const setup = async (initial: string | null = null) => {
  const change = vi.fn();
  const submit = vi.fn((e: React.FormEvent) => e.preventDefault());
  function Demo() {
    const [v, setV] = useState(initial);
    return <form onSubmit={submit}><Combobox label="City" options={CITIES} value={v} onChange={(x) => { change(x); setV(x); }} /></form>;
  }
  const s = await mount(<Demo />);
  await press("{Tab}");
  const input = s.getByRole("combobox");
  const active = () => document.getElementById(focused().getAttribute("aria-activedescendant") ?? "")?.textContent ?? null;
  return { s, change, submit, input, active };
};

test("focus stays in the input while aria-activedescendant moves", async () => {
  const { active } = await setup();
  await press("{ArrowDown}");
  expect(focused().tagName).toBe("INPUT");
  expect(active()).toBe("Ankara");
  await press("{ArrowUp}");
  expect(active()).toBe("Seattle");
  await press("{ArrowDown}");
  expect(active()).toBe("Ankara");
});

test("Enter picks the active option without submitting; a second Enter submits", async () => {
  const { change, submit, input } = await setup();
  await press("irv{ArrowDown}");
  await press("{Enter}");
  expect(change).toHaveBeenCalledExactlyOnceWith("Irvine");
  expect(submit).not.toHaveBeenCalled();
  await expect.element(input).toHaveValue("Irvine");
  await press("{Enter}");
  expect(submit).toHaveBeenCalledTimes(1);
});

test.each([["sao", "São Paulo"], ["istanbul", "İstanbul"], ["COSTA", "Costa Mesa"]])("%s finds %s", async (typed, city) => {
  const { s } = await setup();
  await press(typed);
  expect(s.getByRole("option").elements().map((e) => e.textContent)).toEqual([city]);
});

test("the result count is announced, including none", async () => {
  const { s, input } = await setup();
  await press("san");
  await expect.element(s.getByRole("status")).toHaveTextContent("1 result");
  await press("zz");
  await expect.element(s.getByRole("status")).toHaveTextContent("No results");
  await expect.element(input).toHaveAttribute("aria-expanded", "false");
});

test("text that was never chosen is dropped on blur", async () => {
  const { change, input } = await setup("Irvine");
  await press("{End}xyz");
  await press("{Tab}");
  expect(name()).toBe("after");
  await expect.element(input).toHaveValue("Irvine");
  expect(change).not.toHaveBeenCalled();
});

test("Escape closes first, clears second; emptying the text clears the value", async () => {
  const { s, change, input } = await setup("Irvine");
  await press("{ArrowDown}");
  await press("{Escape}");
  await expect.element(s.getByRole("listbox")).not.toBeInTheDocument();
  await expect.element(input).toHaveValue("Irvine");
  await press("{Escape}");
  await expect.element(input).toHaveValue("");
  expect(change).toHaveBeenLastCalledWith(null);
});

test("clicking an option picks it and keeps focus in the input", async () => {
  const { s, change, input } = await setup();
  await press("{ArrowDown}");
  await s.getByRole("option", { name: "Seattle" }).click();
  expect(change).toHaveBeenCalledExactlyOnceWith("Seattle");
  expect(focused()).toBe(input.element());
});

test("the active option is scrolled into view", async () => {
  const { s } = await setup();
  await press("{ArrowUp}");
  const list = s.getByRole("listbox").element().getBoundingClientRect();
  const opt = s.getByRole("option", { name: "Seattle" }).element().getBoundingClientRect();
  expect(opt.bottom).toBeLessThanOrEqual(list.bottom);
});

test("Enter during IME composition does not pick", async () => {
  const { change, input } = await setup();
  await press("{ArrowDown}");
  input.element().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing: true }));
  expect(change).not.toHaveBeenCalled();
});
