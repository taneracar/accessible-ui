import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Button, ToastProvider, useToast } from "../../src/index";
import { mount, name, press } from "./harness";

function Demo() {
  const toast = useToast();
  return (
    <>
      <Button onClick={() => toast({ message: "Saved", duration: 2500 })}>Save</Button>
      <Button onClick={() => toast({ message: "Failed", kind: "error", duration: 2500 })}>Upload</Button>
    </>
  );
}
const setup = () => mount(<ToastProvider><Demo /></ToastProvider>);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => { warn = vi.spyOn(console, "error"); });
afterEach(() => { expect(warn).not.toHaveBeenCalled(); warn.mockRestore(); });

test("live regions are in the DOM before any message", async () => {
  const s = await setup();
  expect(s.container.querySelector('[role="status"]')).not.toBeNull();
  expect(s.container.querySelector('[role="alert"]')).not.toBeNull();
});

test("info goes to status and leaves; errors go to alert and stay", async () => {
  const s = await setup();
  await press("{Tab}{Enter}{Tab}{Enter}");
  expect(s.container.querySelector('[role="status"]')!.textContent).toContain("Saved");
  expect(s.container.querySelector('[role="alert"]')!.textContent).toContain("Failed");
  expect(name()).toBe("Upload"); // a toast never steals focus
  await wait(3200);
  expect(s.container.textContent).not.toContain("Saved");
  expect(s.container.textContent).toContain("Failed");
});

test("the timer stops while focus is inside, and restarts after", async () => {
  const s = await setup();
  await press("{Tab}{Enter}{Tab}{Tab}");
  expect(name()).toBe("Dismiss");
  await wait(3200);
  expect(s.container.textContent).toContain("Saved");
  await press("{Shift>}{Tab}{/Shift}");
  await wait(3200);
  expect(s.container.textContent).not.toContain("Saved");
});

test("dismissing returns focus to where it came from", async () => {
  await setup();
  await press("{Tab}{Tab}{Enter}{Tab}");
  expect(name()).toBe("Dismiss");
  await press("{Enter}");
  expect(name()).toBe("Upload");
});
