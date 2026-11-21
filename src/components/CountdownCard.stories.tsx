import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CITIES } from "@/lib/santa/cities";
import { buildRoute } from "@/lib/santa/route";
import { fn } from "storybook/test";
import { BottomSheet } from "./BottomSheet";
import { CountdownCard } from "./CountdownCard";

const SEOUL = buildRoute(CITIES, 2026).find((s) => s.id === "seoul")!;
const MIN = 60_000;
/** 한국 시각(KST)으로 적은 2026년 날짜를 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0) => Date.UTC(2026, m - 1, d, h - 9, min);

// 고정형 시트 안에 놓인다.
const meta = {
  title: "메인/CountdownCard",
  component: CountdownCard,
  args: {
    now: SEOUL.arriveUtc - 27 * MIN,
    homeName: "서울 마포구",
    arriveUtc: SEOUL.arriveUtc,
    homeChosen: true,
    onChangeHome: fn(),
  },
  argTypes: { now: { control: "date" }, arriveUtc: { control: "date" } },
  decorators: [
    (Story) => (
      <div className="w-[390px] bg-map-sea pt-8">
        <BottomSheet aria-label="우리 동네까지 남은 시간">
          <Story />
        </BottomSheet>
      </div>
    ),
  ],
} satisfies Meta<typeof CountdownCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  name: "불러오는 중 (시각·고른 동네를 읽기 전)",
  args: { now: null, homeName: null },
};
export const NotChosen: Story = {
  name: "동네 안 고름 (서울 기준)",
  args: { homeName: "서울", homeChosen: false, now: kst(11, 19, 21) },
};
export const Days: Story = { name: "하루 넘게 남음", args: { now: kst(11, 19, 21) } };
export const Hours: Story = { name: "하루 안", args: { now: SEOUL.arriveUtc - 192 * MIN } };
export const Minutes: Story = { name: "1시간 안", args: { now: SEOUL.arriveUtc - 27 * MIN } };
export const UnderMinute: Story = {
  name: "1분 안",
  args: { now: SEOUL.arriveUtc - 30_000 },
};
export const Arrived: Story = { name: "도착", args: { now: SEOUL.arriveUtc + MIN } };
export const Visited: Story = { name: "지나감", args: { now: SEOUL.arriveUtc + 60 * MIN } };
export const Abroad: Story = {
  name: "해외 기기 (한국 시각 표시)",
  args: { showZone: true, now: SEOUL.arriveUtc - 192 * MIN },
};
