import { expect, test, vi } from "vitest";
import { Menu } from "../../src/index";
import { mount, name, press } from "./harness";

const setup = async () => {
  const select = vi.fn();
  const items = ["Rename", "Share", "Archive", "Send"].map((l) => ({ id: l, label: l, onSelect: () => select(l), disabled: l === "Archive" }));
  const s = await mount(<Menu label="Actions" items={items} />);
  await press("{Tab}");
  return { s, select };
};

test("ArrowDown opens on the first item, ArrowUp on the last", async () => {
  await setup();
  await press("{ArrowDown}");
  expect(name()).toBe("Rename");
  await press("{Escape}");
  expect(name()).toContain("Actions");
  await press("{ArrowUp}");
  expect(name()).toBe("Send");
});

test("arrows skip the disabled item and wrap", async () => {
  await setup();
  await press("{Enter}{ArrowDown}{ArrowDown}");
  expect(name()).toBe("Send");
  await press("{ArrowDown}");
  expect(name()).toBe("Rename");
  await press("{End}");
  expect(name()).toBe("Send");
});

test("typeahead: one letter cycles, several letters narrow", async () => {
  await setup();
  await press("{Enter}s");
  expect(name()).toBe("Share");
  await press("e");
  expect(name()).toBe("Send");
});

test.each(["{Enter}", " "])("%s selects once, closes and returns focus", async (key) => {
  const { s, select } = await setup();
  await press("{Enter}{ArrowDown}");
  await press(key);
  expect(select).toHaveBeenCalledExactlyOnceWith("Share");
  await expect.element(s.getByRole("menu")).not.toBeInTheDocument();
  expect(name()).toContain("Actions");
});

test("Tab closes and moves on; it does not trap", async () => {
  const { s } = await setup();
  await press("{Enter}");
  await press("{Tab}");
  await expect.element(s.getByRole("menu")).not.toBeInTheDocument();
  expect(name()).toBe("after");
});

test("clicking a disabled item does nothing; clicking outside closes", async () => {
  const { s, select } = await setup();
  await press("{Enter}");
  await s.getByRole("menuitem", { name: "Archive" }).click({ force: true });
  expect(select).not.toHaveBeenCalled();
  await expect.element(s.getByRole("menu")).toBeVisible();
  await s.getByRole("button", { name: "after" }).click();
  await expect.element(s.getByRole("menu")).not.toBeInTheDocument();
});

test("aria-expanded follows the state", async () => {
  const { s } = await setup();
  const b = s.getByRole("button", { name: "Actions" });
  await expect.element(b).toHaveAttribute("aria-expanded", "false");
  await press("{Enter}");
  await expect.element(b).toHaveAttribute("aria-expanded", "true");
});

test("an action that moves focus itself wins over focus return", async () => {
  const s = await mount(<Menu label="Actions" items={[{ id: "a", label: "Go", onSelect: () => (s.getByRole("button", { name: "after" }).element() as HTMLElement).focus() }]} />);
  await press("{Tab}{Enter}");
  await press("{Enter}");
  expect(name()).toBe("after");
});
