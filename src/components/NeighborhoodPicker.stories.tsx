import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";
import { DEFAULT_HOME, parseStoredHome, serializeHome } from "@/lib/santa/home";
import { NEIGHBORHOODS } from "@/lib/santa/neighborhoods";
import { LocateError, NeighborhoodPicker } from "./NeighborhoodPicker";

/** 한국 시각(KST)으로 적은 2026년 12월 날짜를 epoch ms로 */
const kst = (d: number, h: number, min = 0) => Date.UTC(2026, 11, d, h - 9, min);
const MAPO = parseStoredHome(serializeHome(NEIGHBORHOODS.find((n) => n.label === "서울 마포구")!))!;
const at = (lat: number, lon: number) => () => Promise.resolve({ lat, lon });

// 동네 고르기 시트 안(흰 바탕)에 놓인다. 시트 제목 "우리 동네 고르기"는 ModalSheet가 붙인다.
const meta = {
  title: "시트/NeighborhoodPicker",
  component: NeighborhoodPicker,
  args: {
    now: kst(24, 21),
    home: MAPO,
    chosen: true,
    neighborhoods: NEIGHBORHOODS,
    onPick: fn(),
  },
  argTypes: {
    neighborhoods: { control: false },
    home: { control: false },
    locate: { control: false },
    now: { control: "date" },
  },
  decorators: [
    (Story) => (
      <div className="w-[390px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NeighborhoodPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "내 위치로 찾기"를 누른다 */
const pressFindMe: Story["play"] = async ({ canvasElement }) => {
  await userEvent.click(within(canvasElement).getByRole("button", { name: /내 위치로 찾기/ }));
};

export const NotChosen: Story = {
  name: "빈 검색어 · 아직 안 고름",
  args: { home: DEFAULT_HOME, chosen: false },
};
export const Chosen: Story = { name: "빈 검색어 · 마포구 고름" };
export const Chosung: Story = { name: "ㅁㅍ 검색 (시안)", args: { defaultQuery: "ㅁㅍ" } };
export const Many: Story = { name: "결과 많음 (서울)", args: { defaultQuery: "서울" } };
export const NoResult: Story = { name: "결과 없음", args: { defaultQuery: "런던" } };
export const Finding: Story = {
  name: "위치 찾는 중",
  args: { locate: () => new Promise(() => {}) },
  play: pressFindMe,
};
export const Found: Story = {
  name: "내 위치 근처 (서울시청)",
  args: { locate: at(37.5663, 126.9779), home: DEFAULT_HOME, chosen: false },
  play: pressFindMe,
};
export const Island: Story = {
  name: "내 위치 근처 (연평도)",
  args: { locate: at(37.66, 125.7) },
  play: pressFindMe,
};
export const Denied: Story = {
  name: "위치 권한 거부",
  args: { locate: () => Promise.reject(new LocateError("denied")) },
  play: pressFindMe,
};
export const Unavailable: Story = {
  name: "위치를 못 찾음",
  args: { locate: () => Promise.reject(new LocateError("unavailable")) },
  play: pressFindMe,
};
export const Outside: Story = {
  name: "한국 밖 (후쿠오카)",
  args: { locate: at(33.59, 130.4) },
  play: pressFindMe,
};
export const Loading: Story = { name: "목록 불러오는 중", args: { neighborhoods: null } };
export const Failed: Story = {
  name: "목록 불러오지 못함",
  args: { neighborhoods: null, loadFailed: true },
};
