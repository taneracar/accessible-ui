import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { Button, Combobox, Dialog, Menu, Switch, Tabs, TextField, ToastProvider } from "../../src/index";

it("renders on the server without touching the DOM", () => {
  const html = renderToString(
    <ToastProvider>
      <Button>a</Button>
      <TextField label="b" />
      <Switch label="c" checked onChange={() => {}} />
      <Tabs label="d" tabs={[{ id: "x", title: "x", content: "x" }]} />
      <Dialog open onClose={() => {}} title="e" />
      <Menu label="f" items={[]} />
      <Combobox label="g" options={[]} value={null} onChange={() => {}} />
    </ToastProvider>,
  );
  expect(html).toContain('role="switch"');
  expect(html).not.toContain("<dialog open"); // a non-modal flash before hydration would be wrong
});
