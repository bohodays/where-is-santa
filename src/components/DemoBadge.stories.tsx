import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { fn } from "storybook/test";
import { DemoBadge } from "./DemoBadge";

// 실제 화면에서는 <html data-demo="on">일 때만 보인다(globals.css .demo-only). 스토리에서는 그 속성을 켜 둔다.
const meta = {
  title: "메인/DemoBadge",
  component: DemoBadge,
  args: { speed: 60, onOpen: fn() },
  parameters: { layout: "fullscreen" },
  decorators: [
    function DemoOn(Story) {
      useEffect(() => {
        document.documentElement.setAttribute("data-demo", "on");
        return () => document.documentElement.removeAttribute("data-demo");
      }, []);
      return (
        <div className="mx-auto max-w-md bg-night">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof DemoBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "1초 = 1분" };
export const Fast: Story = { name: "1초 = 10분", args: { speed: 600 } };
export const Loading: Story = { name: "첫 화면 (배속 모름)", args: { speed: null } };
