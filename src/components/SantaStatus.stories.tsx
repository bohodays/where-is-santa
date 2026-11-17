import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SantaStatus } from "./SantaStatus";

// 지금 화면의 유일한 컴포넌트. 시각은 useNow()가 정한다(데모 주소가 없으면 실제 시각).
const meta = {
  title: "컴포넌트/SantaStatus",
  component: SantaStatus,
  args: { homeCityId: "seoul" },
  decorators: [
    (Story) => (
      <div className="w-[358px] bg-night p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SantaStatus>;

export default meta;

export const Seoul: StoryObj<typeof meta> = { name: "서울" };
export const Busan: StoryObj<typeof meta> = {
  name: "부산",
  args: { homeCityId: "busan" },
};
