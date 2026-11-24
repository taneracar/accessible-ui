import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ToastProvider, useToast } from "../index";

function Demo() {
  const toast = useToast();
  return (
    <>
      <Button onClick={() => toast({ message: "Draft saved." })}>Save</Button>{" "}
      <Button variant="secondary" onClick={() => toast({ message: "Upload failed.", kind: "error" })}>Upload</Button>
    </>
  );
}
const meta = { title: "Toast", component: Demo, decorators: [(S) => <ToastProvider><S /></ToastProvider>] } satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Both: Story = {
  play: ({ canvas }) => {
    canvas.getByRole("button", { name: "Save" }).click();
    canvas.getByRole("button", { name: "Upload" }).click();
  },
};
