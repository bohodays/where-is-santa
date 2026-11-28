import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DEFAULT_GREETING } from "@/lib/santa/share";
import { ReceivedPanel } from "./ReceivedPanel";

// 공유 링크로 들어온 사람에게 처음 뜨는 시트 안(흰 바탕). 시트 제목 "친구가 보낸 산타 소식"은 ModalSheet가 붙인다.
const meta = {
  title: "시트/ReceivedPanel",
  component: ReceivedPanel,
  args: {
    greeting: DEFAULT_GREETING,
    homeName: "서울 중구",
    chosen: false,
    onPickHome: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[390px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReceivedPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotChosen: Story = { name: "인사말 · 동네를 아직 안 고름" };
export const Chosen: Story = {
  name: "인사말 · 동네를 고른 사람",
  args: { homeName: "부산 해운대구", chosen: true },
};
export const NoGreeting: Story = {
  name: "인사말 없음 · 동네를 아직 안 고름",
  args: { greeting: "" },
};
export const LongGreeting: Story = {
  name: "긴 인사말 (40자)",
  args: { greeting: "메리 크리스마스! 올해도 정말 고마웠어. 오늘 밤 산타 할아버지 같이 보자 🎅" },
};
