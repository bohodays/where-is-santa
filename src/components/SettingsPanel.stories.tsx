import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DEFAULT_SETTINGS } from "@/lib/santa/settings";
import { SettingsPanel } from "./SettingsPanel";

// 설정 시트 안(흰 바탕)에 놓인다. 시트 제목 "설정"은 ModalSheet가 붙인다.
// 여기서 스위치를 눌러도 화면 모드는 바뀌지 않는다(모드는 위쪽 툴바로 본다). 값은 args로 본다.
const meta = {
  title: "시트/SettingsPanel",
  component: SettingsPanel,
  args: {
    settings: DEFAULT_SETTINGS,
    reduceMotion: false,
    deviceReducedMotion: false,
    onChange: fn(),
    onReduceMotionChange: fn(),
  },
  argTypes: { settings: { control: "object" } },
  decorators: [
    (Story) => (
      <div className="w-[390px] rounded-sheet bg-surface p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "기본값" };
export const DeviceReduced: Story = {
  name: "기기가 움직임 줄이기 (시안)",
  args: { reduceMotion: true, deviceReducedMotion: true },
};
export const AllOn: Story = {
  name: "모두 켬",
  args: {
    settings: { mapTone: "night", largeText: true, highContrast: true, reduceMotion: true },
    reduceMotion: true,
  },
};
export const DeviceReducedButOff: Story = {
  name: "기기는 줄이기, 설정에서 끔",
  args: {
    settings: { ...DEFAULT_SETTINGS, reduceMotion: false },
    reduceMotion: false,
    deviceReducedMotion: true,
  },
};
