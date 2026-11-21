import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ROUTE_SUMMARY } from "@/lib/santa/route-summary";
import { fn } from "storybook/test";
import { BottomSheet } from "./BottomSheet";
import { JourneyProgress } from "./JourneyProgress";

const { first, last } = ROUTE_SUMMARY;
/** 한국 시각(KST)으로 적은 2026년 12월 날짜를 epoch ms로 */
const kst = (d: number, h: number, min = 0) => Date.UTC(2026, 11, d, h - 9, min);

const meta = {
  title: "메인/JourneyProgress",
  component: JourneyProgress,
  args: { start: first.arriveUtc, end: last.arriveUtc, now: kst(25, 0, 5), onShowArrivals: fn() },
  argTypes: { now: { control: "date" }, start: { control: "date" }, end: { control: "date" } },
  decorators: [
    (Story) => (
      <div className="w-[390px] bg-map-sea pt-8">
        <BottomSheet aria-label="산타의 여정">
          <Story />
        </BottomSheet>
      </div>
    ),
  ],
} satisfies Meta<typeof JourneyProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scene: Story = { name: "시안 장면 (밤 12시 5분)" };
export const Before: Story = { name: "출발 전 (빈 막대)", args: { now: kst(24, 12) } };
export const After: Story = { name: "끝난 뒤 (100%)", args: { now: kst(26, 0) } };
export const Loading: Story = { name: "불러오는 중", args: { now: null } };
