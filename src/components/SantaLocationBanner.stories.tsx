import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CITIES } from "@/lib/santa/cities";
import { buildRoute } from "@/lib/santa/route";
import { SantaLocationBanner } from "./SantaLocationBanner";

const ROUTE = buildRoute(CITIES, 2026);
/** 한국 시각(KST)으로 적은 2026년 12월 날짜를 epoch ms로 */
const kst = (d: number, h: number, min = 0, s = 0) => Date.UTC(2026, 11, d, h - 9, min, s);

// 지도 위에 놓인다. 바탕은 지도 바다색이라 툴바의 낮/밤 지도에 따라 바뀐다.
const meta = {
  title: "메인/SantaLocationBanner",
  component: SantaLocationBanner,
  args: { route: ROUTE, now: kst(25, 0, 26, 40) },
  argTypes: { route: { control: false }, now: { control: "date" } },
  decorators: [
    (Story) => (
      <div className="w-[358px] bg-map-sea p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SantaLocationBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Before: Story = { name: "출발 전", args: { now: kst(19, 21) } };
export const Visiting: Story = { name: "도시 방문 중", args: { now: kst(25, 0, 26, 10) } };
export const FlyingNear: Story = {
  name: "비행 중 (가까운 도시)",
  args: { now: kst(25, 0, 27, 30) },
};
export const FlyingFar: Story = { name: "비행 중 (먼 도시)", args: { now: kst(25, 1, 30) } };
export const After: Story = { name: "끝난 뒤", args: { now: kst(26, 0) } };
export const Loading: Story = { name: "불러오는 중", args: { now: null } };
