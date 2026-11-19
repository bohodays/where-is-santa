import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { fontVariables } from "../src/app/fonts";
import "../src/app/globals.css";

// 툴바에서 고른 모드를 <html> 속성으로 켠다. 앱과 같은 방식이라 토큰이 그대로 따라 바뀐다(docs/design-tokens.md).
const withModes: Decorator = (Story, context) => {
  const { mapTone, textSize, contrast } = context.globals;
  useEffect(() => {
    const html = document.documentElement;
    html.lang = "ko";
    html.classList.add(...fontVariables.split(" "));
    const set = (name: string, value: unknown, off: string) => {
      if (typeof value === "string" && value !== off) html.setAttribute(name, value);
      else html.removeAttribute(name);
    };
    set("data-map-tone", mapTone, "night");
    set("data-text-size", textSize, "normal");
    set("data-contrast", contrast, "normal");
  }, [mapTone, textSize, contrast]);
  return <Story />;
};

const preview: Preview = {
  decorators: [withModes],
  globalTypes: {
    mapTone: {
      description: "지도 밝기",
      toolbar: {
        title: "지도",
        items: [
          { value: "night", title: "밤 지도" },
          { value: "day", title: "낮 지도" },
        ],
        dynamicTitle: true,
      },
    },
    textSize: {
      description: "글자 크기",
      toolbar: {
        title: "글자",
        items: [
          { value: "normal", title: "보통 글씨" },
          { value: "large", title: "큰 글씨" },
        ],
        dynamicTitle: true,
      },
    },
    contrast: {
      description: "대비",
      toolbar: {
        title: "대비",
        items: [
          { value: "normal", title: "보통 대비" },
          { value: "high", title: "고대비" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { mapTone: "night", textSize: "normal", contrast: "normal" },
  parameters: {
    layout: "centered",
    backgrounds: { disable: true },
    a11y: { test: "error" },
  },
};

export default preview;
