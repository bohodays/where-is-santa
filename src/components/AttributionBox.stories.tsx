import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AttributionBox } from "./AttributionBox";

// 설정 시트 맨 아래(흰 바탕)에 놓인다.
const meta = {
  title: "시트/AttributionBox",
  component: AttributionBox,
  decorators: [
    (Story) => (
      <div className="w-[390px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AttributionBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "기본" };
