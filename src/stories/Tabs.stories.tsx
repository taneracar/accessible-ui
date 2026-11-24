import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "../index";

const meta = {
  title: "Tabs", component: Tabs,
  args: {
    label: "Project",
    tabs: [
      { id: "overview", title: "Overview", content: "Two open tasks." },
      { id: "members", title: "Members", content: "Five people." },
      { id: "billing", title: "Billing", content: "Next invoice on the first." },
    ],
  },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SecondSelected: Story = { args: { defaultTab: "members" } };
export const ManualActivation: Story = { args: { activation: "manual" } };
