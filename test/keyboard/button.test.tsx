import { expect, test, vi } from "vitest";
import { Button, Switch, TextField } from "../../src/index";
import { focused, mount, name, press } from "./harness";

test("unavailable: focusable, described, and neither clicks nor submits", async () => {
  const click = vi.fn();
  const submit = vi.fn((e: React.FormEvent) => e.preventDefault());
  await mount(
    <form onSubmit={submit}>
      <Button type="submit" unavailable onClick={click} aria-describedby="why">Publish</Button>
      <p id="why">Add a title</p>
    </form>,
  );
  await press("{Tab}");
  expect(name()).toBe("Publish");
  await expect.element(focused()).toHaveAccessibleDescription("Add a title");
  await press("{Enter}");
  await press(" ");
  expect(click).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});

test("defaults to type=button, so it cannot submit by accident", async () => {
  const submit = vi.fn((e: React.FormEvent) => e.preventDefault());
  await mount(<form onSubmit={submit}><Button>Preview</Button></form>);
  await press("{Tab}{Enter}");
  expect(submit).not.toHaveBeenCalled();
});

test("text field: label, hint and error all reach the accessibility tree", async () => {
  await mount(<TextField label="Email" hint="Receipts only" error="Missing @" required />);
  await press("{Tab}");
  await expect.element(focused()).toHaveAccessibleName("Email");
  await expect.element(focused()).toHaveAccessibleDescription("Receipts only Error: Missing @");
  await expect.element(focused()).toBeInvalid();
});

test("switch: Space and Enter toggle", async () => {
  const change = vi.fn();
  await mount(<Switch label="Alerts" checked={false} onChange={change} />);
  await press("{Tab} ");
  await press("{Enter}");
  expect(change.mock.calls).toEqual([[true], [true]]);
});

test("interactive targets are at least 44px tall", async () => {
  const s = await mount(<><Button>Go</Button><Switch label="Alerts" checked onChange={() => {}} /><TextField label="Email" /></>);
  for (const el of [s.getByRole("button", { name: "Go" }), s.getByRole("switch"), s.getByRole("textbox")])
    expect(el.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
});

test("keyboard focus draws a visible ring", async () => {
  await mount(<Button>Go</Button>);
  await press("{Tab}");
  const { outlineStyle, outlineWidth } = getComputedStyle(focused());
  expect([outlineStyle, outlineWidth]).toEqual(["solid", "3px"]);
});
