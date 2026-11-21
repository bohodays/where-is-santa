import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json의 paths("@/*" → src/*)와 같게 둔다. 컴포넌트 쪽 순수 함수 테스트가 @/로 lib을 부른다
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
