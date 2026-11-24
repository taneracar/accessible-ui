import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent } from "storybook/test";
import { Button } from "../index";

const meta = { title: "Button", component: Button, args: { children: "Save changes" } } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Danger: Story = { args: { variant: "danger", children: "Delete project" } };
export const Unavailable: Story = {
  render: () => (
    <>
      <Button unavailable aria-describedby="why">Publish</Button>
      <p id="why">Add a title before publishing.</p>
    </>
  ),
};
export const Focused: Story = { play: async () => { await userEvent.tab(); } };
