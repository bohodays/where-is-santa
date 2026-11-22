import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DemoPanel } from "./DemoPanel";

// 데모 시트 안(흰 바탕)에 놓인다. 시트 제목("미리 체험해 보기"/"데모 모드")은 ModalSheet가 붙인다.
// 여기서 누르면 args의 함수만 불린다(시계는 바뀌지 않는다).
const meta = {
  title: "시트/DemoPanel",
  component: DemoPanel,
  args: {
    activeSpeed: null,
    homeName: "서울 마포구",
    onStart: fn(),
    onSpeedChange: fn(),
    onStop: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[390px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DemoPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Before: Story = { name: "데모 전 (시안)" };
export const BeforeNoHome: Story = { name: "데모 전, 동네 모름", args: { homeName: null } };
export const Active: Story = { name: "데모 중 (1초=1분)", args: { activeSpeed: 60 } };
export const ActiveOddSpeed: Story = {
  name: "데모 중, 주소에 적은 배속(30배)",
  args: { activeSpeed: 30 },
};
