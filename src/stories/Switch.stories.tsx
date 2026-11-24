import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Switch } from "../index";

const meta = {
  title: "Switch", component: Switch, args: { label: "Email notifications", checked: false, onChange: () => {} },
  render: function Render(args) {
    const [on, setOn] = useState(args.checked);
    return <Switch {...args} checked={on} onChange={setOn} />;
  },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { checked: true } };
