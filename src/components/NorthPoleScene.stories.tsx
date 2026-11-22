import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ROUTE_SUMMARY } from "@/lib/santa/route-summary";
import { BottomSheet } from "./BottomSheet";
import { NorthPoleScene } from "./NorthPoleScene";

/** 한국 시각(KST)으로 적은 2026년 날짜를 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0) => Date.UTC(2026, m - 1, d, h - 9, min);

// 휴대폰 화면처럼 위쪽은 그림, 아래쪽은 고정형 시트가 덮는다(시트 자리는 비워 둔 상자).
const meta = {
  title: "메인/NorthPoleScene",
  component: NorthPoleScene,
  args: { phase: "before", first: ROUTE_SUMMARY.first, now: kst(11, 21, 21), onPreview: fn() },
  argTypes: { first: { control: false }, now: { control: "date" } },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto flex h-screen max-w-md flex-col bg-night">
        <div className="min-h-0 flex-1">
          <Story />
        </div>
        <BottomSheet aria-label="우리 동네까지 남은 시간">
          <p className="h-40 text-body text-ink-soft">(카운트다운 카드 자리)</p>
        </BottomSheet>
      </div>
    ),
  ],
} satisfies Meta<typeof NorthPoleScene>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Before: Story = { name: "출발 전 (한 달 넘게)" };
// 진짜 이브에는 미리 보기를 권하지 않는다(demoOffered)
export const BeforeTonight: Story = {
  name: "출발 전 (당일 저녁, 미리 보기 없음)",
  args: { now: kst(12, 24, 17), onPreview: undefined },
};
export const BeforeAbroad: Story = {
  name: "출발 전 (해외 기기)",
  args: { now: kst(12, 24, 17), showZone: true, onPreview: undefined },
};
export const After: Story = { name: "끝난 뒤", args: { phase: "after", now: kst(12, 26, 9) } };
export const Loading: Story = { name: "불러오는 중", args: { now: null } };
