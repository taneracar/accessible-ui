import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextField } from "../index";

const meta = { title: "TextField", component: TextField, args: { label: "Work email" } } satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: "We only use it for receipts.", required: true, placeholder: "name@company.com" } };
export const WithError: Story = { args: { hint: "We only use it for receipts.", error: "Enter an address with an @ sign.", defaultValue: "jo.company.com" } };
