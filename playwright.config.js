// 画面テスト（npm run test:e2e）。PCに入っている Edge を使う（ブラウザの追加ダウンロード不要）
import { defineConfig } from "@playwright/test";

const PORT = 8181;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}/kondate-app/`,
    channel: "msedge",
    viewport: { width: 390, height: 844 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    serviceWorkers: "block", // オフラインのテストだけ有効にする
  },
  webServer: {
    command: `node tests/e2e/server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/kondate-app/`,
    reuseExistingServer: false,
  },
});
