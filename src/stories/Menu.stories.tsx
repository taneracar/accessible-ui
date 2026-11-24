import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "../index";

const noop = () => {};
const meta = {
  title: "Menu", component: Menu,
  args: {
    label: "Actions",
    items: [
      { id: "rename", label: "Rename", onSelect: noop },
      { id: "share", label: "Share", onSelect: noop },
      { id: "archive", label: "Archive", onSelect: noop, disabled: true },
      { id: "delete", label: "Delete", onSelect: noop },
    ],
  },
} satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Open: Story = { play: ({ canvas }) => canvas.getByRole("button").click() };
