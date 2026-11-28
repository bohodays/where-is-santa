import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";
import { DEFAULT_HOME, parseStoredHome, serializeHome } from "@/lib/santa/home";
import { NEIGHBORHOODS } from "@/lib/santa/neighborhoods";
import { SharePanel } from "./SharePanel";

const MAPO = parseStoredHome(serializeHome(NEIGHBORHOODS.find((n) => n.label === "서울 마포구")!))!;
const ORIGIN = "https://where-is-santa.vercel.app";

// 공유 시트 안(흰 바탕)에 놓인다. 시트 제목 "친구에게 알려주기"는 ModalSheet가 붙인다.
// 복사·보내기는 args의 가짜 함수만 불린다(실제 클립보드·공유 창을 쓰지 않는다).
const meta = {
  title: "시트/SharePanel",
  component: SharePanel,
  args: {
    home: MAPO,
    chosen: true,
    onPickHome: fn(),
    origin: ORIGIN,
    copy: fn(() => Promise.resolve()),
    share: fn(() => Promise.resolve()),
  },
  argTypes: {
    home: { control: false },
    copy: { control: false },
    share: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-[390px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SharePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const press =
  (name: string): Story["play"] =>
  async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name }));
  };

export const Default: Story = { name: "기본 (시안)" };
export const NotChosen: Story = {
  name: "동네를 아직 안 고름 (기본 동네 카드)",
  args: { home: DEFAULT_HOME, chosen: false },
};
export const NoWebShare: StoryObj<typeof SharePanel> = {
  name: "공유 기능 없는 브라우저 (복사만)",
  args: { share: null },
};
export const Empty: Story = {
  name: "인사말 없음 (카드 제목이 미리보기 제목)",
  args: { defaultGreeting: "" },
};
export const TooLong: Story = {
  name: "40자 초과",
  args: {
    defaultGreeting:
      "메리 크리스마스! 올해도 정말 고마웠어. 오늘 밤 산타 할아버지 꼭 같이 보자 🎅🎄",
  },
};
export const Copied: Story = { name: "복사됨", play: press("링크 복사") };
export const CopyFailed: Story = {
  name: "복사 실패 (주소를 직접 복사)",
  args: { copy: fn(() => Promise.reject(new Error("막힘"))) },
  play: press("링크 복사"),
};
export const ShareFailed: Story = {
  name: "보내기 실패",
  args: { share: fn(() => Promise.reject(new Error("실패"))) },
  play: press("메신저로 보내기"),
};
export const Narrow: Story = {
  name: "좁은 화면 (320px)",
  decorators: [
    (Story) => (
      <div className="w-[320px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
};
