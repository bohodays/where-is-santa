import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildRoute } from "@/lib/santa/route";
import { ROUTE_SUMMARY, ROUTE_YEAR } from "@/lib/santa/route-summary";
import { STOPS } from "@/lib/santa/stops";
import { ArrivalList } from "./ArrivalList";

const ROUTE = buildRoute(STOPS, ROUTE_YEAR);
/** 한국 시각(KST)으로 적은 2026년 12월 날짜를 epoch ms로 */
const kst = (d: number, h: number, min = 0) => Date.UTC(2026, 11, d, h - 9, min);

// 도착 순서 시트 안(흰 바탕)에 놓인다. 시트 제목·"한국 시각 기준"은 ModalSheet가 붙인다.
const meta = {
  title: "시트/ArrivalList",
  component: ArrivalList,
  args: { now: kst(25, 0, 20), route: ROUTE, homeId: ROUTE_SUMMARY.defaultHome.id },
  argTypes: { route: { control: false }, now: { control: "date" } },
  decorators: [
    (Story) => (
      <div className="w-[390px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArrivalList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Before: Story = { name: "출발 전 (예정 목록)", args: { now: kst(24, 17) } };
export const JustDeparted: Story = { name: "출발 직후", args: { now: kst(24, 19, 40) } };
export const NearKorea: Story = { name: "한국 근처 (밤 12시 20분)" };
export const HomePassed: Story = { name: "우리 동네 지난 뒤", args: { now: kst(25, 0, 40) } };
export const Loading: Story = { name: "불러오는 중", args: { route: null } };
export const Failed: Story = { name: "불러오지 못함", args: { route: null, loadFailed: true } };
