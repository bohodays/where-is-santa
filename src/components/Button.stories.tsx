import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button, LinkButton } from "./Button";

// 버튼은 바텀시트(흰 바탕) 안에 놓인다. 폭은 시안의 시트 안쪽 폭(358px).
const meta = {
  title: "기본/Button",
  component: Button,
  args: { children: "친구에게 알려주기", variant: "primary" },
  decorators: [
    (Story) => (
      <div className="flex w-[358px] flex-col gap-3 rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { name: "주 버튼" };

export const Secondary: Story = {
  name: "보조 버튼",
  args: { variant: "secondary", children: "산타 따라가기" },
};

export const Quiet: Story = {
  name: "글자 버튼",
  args: { variant: "quiet", children: "동네 바꾸기" },
};

export const Disabled: Story = {
  name: "사용 불가",
  args: { disabled: true },
};

export const Busy: Story = {
  name: "진행 중",
  args: { busy: true, children: "복사 중…" },
};

export const AllVariants: Story = {
  name: "한눈에 보기",
  render: () => (
    <>
      <Button className="w-full">친구에게 알려주기</Button>
      <Button variant="secondary" className="w-full">
        산타 따라가기
      </Button>
      <div className="flex items-center justify-between">
        <span className="text-body text-ink-soft">서울 마포구까지</span>
        <Button variant="quiet">동네 바꾸기</Button>
      </div>
      <LinkButton href="#arrivals">도착 순서 보기</LinkButton>
      <Button className="w-full" disabled>
        사용 불가
      </Button>
      <Button className="w-full" busy>
        복사 중…
      </Button>
    </>
  ),
};

export const LongText: Story = {
  name: "긴 글자 (툴바에서 큰 글씨로 확인)",
  args: {
    className: "w-full",
    children: "우리 동네에 산타가 오는 시각을 친구에게 알려주기",
  },
};
