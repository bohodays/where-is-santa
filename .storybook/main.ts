import type { StorybookConfig } from "@storybook/nextjs-vite";

// 스토리는 컴포넌트 옆(src/components/**/X.stories.tsx)에 두고, 토큰처럼 컴포넌트가 아닌 문서는 src/stories/에 둔다.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  staticDirs: ["../public"],
  core: { disableTelemetry: true },
};

export default config;
