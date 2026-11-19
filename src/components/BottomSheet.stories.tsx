import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { ModalSheet } from "./ModalSheet";

// 휴대폰 화면 크기의 앱 바탕(지도 자리) 위에 시트를 놓는다.
const meta = {
  title: "기본/BottomSheet",
  component: BottomSheet,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-end bg-map-sea">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 메인 아래에 늘 떠 있는 판. 내용은 3~4주차 CountdownCard 자리 */
export const Fixed: Story = {
  name: "고정형",
  render: () => (
    <BottomSheet aria-label="우리 동네까지 남은 시간">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body text-ink-soft">서울 마포구까지</span>
        <Button variant="quiet">동네 바꾸기</Button>
      </div>
      <p className="font-display text-countdown text-ink">37일 2시간</p>
      <Button variant="quiet" className="self-start">
        도착 순서 보기
      </Button>
    </BottomSheet>
  ),
};

const CITIES = [
  ["밤 11시 41분", "도쿄"],
  ["밤 11시 58분", "오사카"],
  ["밤 12시 18분", "후쿠오카"],
  ["밤 12시 23분", "부산"],
  ["밤 12시 25분", "대구"],
  ["밤 12시 29분", "대전"],
  ["밤 12시 32분", "서울"],
  ["밤 12시 32분", "광주"],
  ["밤 12시 33분", "인천"],
  ["밤 12시 33분", "제주"],
  ["밤 12시 53분", "타이베이"],
  ["밤 12시 54분", "상하이"],
  ["밤 12시 55분", "마닐라"],
  ["새벽 1시 14분", "베이징"],
  ["새벽 1시 22분", "홍콩"],
  ["새벽 2시 4분", "싱가포르"],
];

/** 버튼을 누르면 열리는 모달 시트. open 상태는 쓰는 쪽(여기서는 이 스토리)이 가진다 */
function ModalDemo({ long, startOpen }: { long: boolean; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <div className="p-5">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          도착 순서 보기
        </Button>
      </div>
      <ModalSheet
        open={open}
        onClose={() => setOpen(false)}
        title="산타의 도착 순서"
        subtitle="한국 시각 기준"
      >
        {long ? (
          <ol className="flex flex-col border-t border-line">
            {CITIES.map(([time, name]) => (
              <li
                key={name}
                className="grid min-h-12 grid-cols-[7rem_1fr] items-center gap-2 border-b border-line text-body"
              >
                <span className="tabular-nums text-ink-soft">{time}</span>
                <span className="text-body-lg text-ink">{name}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-body text-ink">산타가 지나가는 도시를 시간 순서로 보여줘요.</p>
        )}
      </ModalSheet>
    </>
  );
}

export const ModalShort: Story = {
  name: "모달형 (짧은 내용)",
  render: () => <ModalDemo long={false} startOpen />,
};

export const ModalLong: Story = {
  name: "모달형 (긴 내용, 스크롤)",
  render: () => <ModalDemo long startOpen />,
};

export const ModalClosed: Story = {
  name: "모달형 (닫힘, 버튼으로 열기)",
  render: () => <ModalDemo long startOpen={false} />,
};
