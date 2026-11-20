import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CITIES } from "@/lib/santa/cities";
import { buildRoute } from "@/lib/santa/route";
import { fn } from "storybook/test";
import { BottomSheet } from "./BottomSheet";
import { JourneyProgress } from "./JourneyProgress";

const ROUTE = buildRoute(CITIES, 2026);
/** 한국 시각(KST)으로 적은 2026년 12월 날짜를 epoch ms로 */
const kst = (d: number, h: number, min = 0) => Date.UTC(2026, 11, d, h - 9, min);

const meta = {
  title: "메인/JourneyProgress",
  component: JourneyProgress,
  args: { route: ROUTE, now: kst(25, 0, 5), onShowArrivals: fn() },
  argTypes: { route: { control: false }, now: { control: "date" } },
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

export const Scene: Story = { name: "시안 장면 (밤 12시 5분, 18%)" };
export const Before: Story = { name: "출발 전 (0%)", args: { now: kst(24, 12) } };
export const After: Story = { name: "끝난 뒤 (100%)", args: { now: kst(26, 0) } };
export const Loading: Story = { name: "불러오는 중", args: { now: null } };
