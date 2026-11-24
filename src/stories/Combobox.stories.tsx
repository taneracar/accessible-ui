import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent } from "storybook/test";
import { Combobox } from "../index";
import { CITIES } from "./data";

const meta = {
  title: "Combobox", component: Combobox,
  args: { label: "City", hint: "Type to filter.", options: CITIES, value: null, onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <Combobox {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Selected: Story = { args: { value: "Irvine" } };
export const Filtering: Story = { play: async ({ canvas }) => { await userEvent.type(canvas.getByRole("combobox"), "san{ArrowDown}"); } };
export const NoResults: Story = { play: async ({ canvas }) => { await userEvent.type(canvas.getByRole("combobox"), "zzz"); } };
