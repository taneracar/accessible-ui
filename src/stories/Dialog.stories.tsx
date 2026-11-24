import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button, Combobox, Dialog, type DialogProps, TextField } from "../index";
import { CITIES } from "./data";

function Demo({ opener, ...props }: Omit<DialogProps, "open" | "onClose"> & { opener: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{opener}</Button>
      <Dialog
        {...props}
        open={open}
        onClose={() => setOpen(false)}
        actions={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>{props.actions}</>}
      />
    </>
  );
}

const meta = {
  title: "Dialog", component: Demo,
  args: { opener: "Edit profile", title: "Edit profile", description: "Changes are visible to your team." },
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Open: Story = {
  args: { children: <TextField label="Display name" /> },
  play: ({ canvas, args }) => canvas.getByRole("button", { name: args.opener }).click(),
};
export const Confirm: Story = {
  args: { opener: "Delete project", role: "alertdialog", title: "Delete this project?", description: "This cannot be undone.", actions: <Button variant="danger">Delete</Button> },
  play: Open.play,
};
function CityField() {
  const [city, setCity] = useState<string | null>(null);
  return <Combobox label="City" options={CITIES} value={city} onChange={setCity} />;
}
export const WithCombobox: Story = { args: { children: <CityField /> }, play: Open.play };
