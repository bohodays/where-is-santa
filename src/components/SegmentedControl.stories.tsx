import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { SegmentedControl } from "./SegmentedControl";

const MAP_TONES = [
  { value: "auto", label: "자동" },
  { value: "day", label: "밝게" },
  { value: "night", label: "어둡게" },
] as const;
const SPEEDS = [
  { value: "1", label: "실제 속도" },
  { value: "60", label: "1초=1분" },
  { value: "600", label: "1초=10분" },
] as const;

// 눌러 보거나 Tab으로 들어가 화살표 키로 옮겨 본다(스토리 안에서만 기억).
const meta = {
  title: "기본/SegmentedControl",
  component: SegmentedControl,
  args: {
    label: "지도 밝기",
    description: "자동: 우리 동네에 해가 지면 밤 지도로 바뀌어요.",
    options: MAP_TONES,
    value: "auto",
    onChange: fn(),
  },
  argTypes: { options: { control: false } },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <SegmentedControl
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
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
} satisfies Meta<typeof SegmentedControl<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MapTone: Story = { name: "지도 밝기" };
export const DemoSpeed: Story = {
  name: "데모 속도",
  args: { label: "시간 흐름", description: undefined, options: SPEEDS, value: "60" },
};
