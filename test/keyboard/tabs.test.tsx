import { expect, test, vi } from "vitest";
import { Tabs } from "../../src/index";
import { focused, mount, name, press } from "./harness";

const tabs = ["One", "Two", "Three"].map((t) => ({ id: t, title: t, content: `${t} panel` }));
const selected = (s: Awaited<ReturnType<typeof mount>>) => s.getByRole("tab", { selected: true }).element().textContent;

test("one tab stop for the list, then the panel, then out", async () => {
  await mount(<Tabs label="L" tabs={tabs} defaultTab="Two" />);
  await press("{Tab}");
  expect(name()).toBe("Two");
  await press("{Tab}");
  expect(focused().getAttribute("role")).toBe("tabpanel");
  await press("{Tab}");
  expect(name()).toBe("after");
});

test("arrows wrap and select; Home and End jump", async () => {
  const s = await mount(<Tabs label="L" tabs={tabs} />);
  await press("{Tab}{ArrowLeft}");
  expect([name(), selected(s)]).toEqual(["Three", "Three"]);
  await press("{ArrowRight}");
  expect([name(), selected(s)]).toEqual(["One", "One"]);
  await press("{End}");
  expect(selected(s)).toBe("Three");
  await press("{Home}");
  expect(selected(s)).toBe("One");
});

test("manual activation: arrows only move focus", async () => {
  const change = vi.fn();
  const s = await mount(<Tabs label="L" tabs={tabs} activation="manual" onChange={change} />);
  await press("{Tab}{ArrowRight}");
  expect([name(), selected(s)]).toEqual(["Two", "One"]);
  expect(change).not.toHaveBeenCalled();
  await press("{Enter}");
  expect(selected(s)).toBe("Two");
  expect(change).toHaveBeenCalledExactlyOnceWith("Two");
});

test("right-to-left: ArrowLeft goes to the next tab, ArrowRight back", async () => {
  await mount(<div dir="rtl"><Tabs label="L" tabs={tabs} /></div>);
  await press("{Tab}{ArrowLeft}");
  expect(name()).toBe("Two");
  await press("{ArrowRight}");
  expect(name()).toBe("One");
});

test("falls back when the selected tab is removed", async () => {
  const s = await mount(<Tabs label="L" tabs={tabs} defaultTab="Three" />);
  await s.rerender(<Tabs label="L" tabs={tabs.slice(0, 2)} />);
  expect(s.getByRole("tab", { selected: true }).elements()).toHaveLength(1);
});
