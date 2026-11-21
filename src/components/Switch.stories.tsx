import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { Switch } from "./Switch";

// 설정 시트 안(흰 바탕)에 놓인다. 눌러 보면 켜짐/꺼짐이 바뀐다(스토리 안에서만 기억).
const meta = {
  title: "기본/Switch",
  component: Switch,
  args: { label: "큰 글씨", checked: false, onCheckedChange: fn() },
  render: function Render(args) {
    const [checked, setChecked] = useState(args.checked);
    return (
      <Switch
        {...args}
        checked={checked}
        onCheckedChange={(next) => {
          setChecked(next);
          args.onCheckedChange(next);
        }}
      />
    );
  },
  decorators: [
    (Story) => (
      <div className="w-[390px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = { name: "꺼짐" };
export const On: Story = { name: "켜짐", args: { label: "고대비", checked: true } };
export const WithDescription: Story = {
  name: "설명 있음",
  args: { label: "움직임 줄이기", description: "기기 설정을 따라 켜져 있어요", checked: true },
};
