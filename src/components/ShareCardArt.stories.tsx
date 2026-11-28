import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DEFAULT_SHARE_CARD, shareCardText } from "@/lib/santa/share";
import { ShareCardArt } from "./ShareCardArt";

// 공유 카드 그림. 서버는 같은 코드로 1200×630 PNG를 만든다(src/app/og). 여기서는 화면에서 줄여 보이는 모습이다.
// 다른 사람의 메신저에 보일 그림이라 낮 지도·고대비 설정과 상관없이 늘 같은 색이다.
const toContainerWidth = (px: number) => `${((px / 1200) * 100).toFixed(3)}cqw`;

const meta = {
  title: "공유/ShareCardArt",
  component: ShareCardArt,
  args: {
    ...shareCardText("서울 마포구", Date.UTC(2026, 11, 24, 15, 32)),
    u: toContainerWidth,
    fonts: { display: "var(--font-display)", sans: "var(--font-sans)" },
  },
  argTypes: { u: { control: false }, fonts: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-[600px] [container-type:inline-size]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ShareCardArt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neighborhood: Story = { name: "동네 카드 (서울 마포구)" };
export const LongName: Story = {
  name: "긴 이름 (수원시 장안구)",
  args: shareCardText("수원시 장안구", Date.UTC(2026, 11, 24, 15, 31)),
};
export const Default: Story = { name: "첫 페이지 카드 (북극 출발)", args: DEFAULT_SHARE_CARD };
