import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildRoute } from "@/lib/santa/route";
import { ROUTE_SUMMARY, ROUTE_YEAR } from "@/lib/santa/route-summary";
import { STOPS } from "@/lib/santa/stops";
import { SantaMap } from "./SantaMap";

// 지도는 시계를 읽는 함수(readNow)를 받으므로, 스토리에서 시각을 고정하거나 빠르게 흐르게 할 수 있다.
// 타일 지도 스토리는 OpenFreeMap에 접속한다(인터넷 필요). 윤곽 지도·지도 없음 스토리는 접속하지 않는다.
// 툴바의 낮/밤 지도로 바꾸면 색이 바뀐다(지도를 다시 그리려면 스토리를 다시 연다. 자동 전환은 순서 4-4).

const ROUTE = buildRoute(STOPS, ROUTE_YEAR);
const HOME = ROUTE_SUMMARY.defaultHome;
/** 한국 시각 12월 25일 밤 12시 5분(서울 중구까지 26분) */
const SCENE = Date.UTC(2026, 11, 24, 15, 5);
const fixed = () => SCENE;
/** 1초에 1분씩 흐르는 시계 */
const startedAt = Date.now();
const fast = () => SCENE + (Date.now() - startedAt) * 60;

const meta = {
  title: "지도/SantaMap",
  component: SantaMap,
  args: { route: ROUTE, readNow: fixed, home: HOME },
  argTypes: {
    route: { control: false },
    readNow: { control: false },
    home: { control: false },
  },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative mx-auto h-[560px] max-w-md overflow-hidden bg-night">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SantaMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tiles: Story = { name: "타일 지도 (OpenFreeMap)" };
export const Moving: Story = { name: "타일 지도, 1초 = 1분", args: { readNow: fast } };
export const Outline: Story = {
  name: "윤곽 지도 (OpenFreeMap 장애)",
  args: { forceMode: "outline" },
};
export const NoMap: Story = { name: "지도 없음 (지도 JS 실패)", args: { forceMode: "none" } };
