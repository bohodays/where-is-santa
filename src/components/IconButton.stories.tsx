import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IconButton } from "./IconButton";
import { CloseIcon, GearIcon } from "./icons";

const meta = {
  title: "기본/IconButton",
  component: IconButton,
  args: { label: "설정", icon: <GearIcon />, look: "float" },
  argTypes: { icon: { control: false } },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 지도 위 오른쪽 위. 바탕은 지도 바다색이라 툴바의 낮/밤 지도에 따라 바뀐다 */
export const OnMap: Story = {
  name: "지도 위 (설정)",
  decorators: [
    (Story) => (
      <div className="flex h-[160px] w-[358px] items-start justify-end bg-map-sea p-4">
        <Story />
      </div>
    ),
  ],
};

/** 모달 시트의 제목 옆 */
export const InSheet: Story = {
  name: "시트 안 (닫기)",
  args: { label: "닫기", icon: <CloseIcon />, look: "plain" },
  decorators: [
    (Story) => (
      <div className="flex w-[358px] items-center justify-between rounded-sheet bg-surface p-5">
        <h2 className="text-title font-bold text-ink">도착 순서</h2>
        <Story />
      </div>
    ),
  ],
};
