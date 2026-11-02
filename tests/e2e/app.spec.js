// スマホ幅（390px）で主要な操作を一通り。テストごとに新しいブラウザ（データは空）で始まる
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  // CSP違反やJSのエラーはここに出る
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("dialog", d => { errors.push(`予期しないダイアログ: ${d.message()}`); d.dismiss(); });
});
test.afterEach(() => {
  // AIの「回数上限」をわざと返すテストで、ブラウザが自動で出す通信エラーの記録だけは除く
  expect(errors.filter(e => !/status of 429/.test(e))).toEqual([]);
});

const tab = (page, name) => page.locator(".tabbar a", { hasText: name }).click();
const title = page => page.locator("#title");
const closeToast = page => page.locator("#modal .btn.primary", { hasText: "OK" }).click();

async function pngBuffer(page) {
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 1600; c.height = 1200;
    const x = c.getContext("2d");
    x.fillStyle = "#e07a5f"; x.fillRect(0, 0, 1600, 1200);
    x.fillStyle = "#fff"; x.fillRect(400, 300, 800, 600);
    return c.toDataURL("image/png");
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

async function planWeek(page) {
  await page.goto("./");
  await page.getByRole("button", { name: "1週間分決める" }).click();
  await expect(page.locator("#view .list .row")).toHaveCount(14);
  await page.getByRole("button", { name: "この1週間で決定" }).click();
  await expect(page).toHaveURL(/#calendar$/);
}

test("サブパスで開ける・アイコンとmanifest", async ({ page, request }) => {
  await page.goto("./");
  await expect(title(page)).toHaveText(/\d+月\d+日（.）/);
  await expect(page.getByRole("button", { name: "ランダム" })).toBeVisible();
  const manifest = await (await request.get("manifest.json")).json();
  for (const i of manifest.icons) expect((await request.get(i.src)).ok()).toBeTruthy();
});

test("1週間分を決めるとカレンダーに入る", async ({ page }) => {
  await planWeek(page);
  const cards = page.locator("#view .card");
  await expect(cards).toHaveCount(2);
  await expect(cards.filter({ hasText: "なし" })).toHaveCount(0);
});

test("人数を変えて買い物リストへ", async ({ page }) => {
  await page.goto("./#search");
  await page.getByRole("searchbox", { name: "検索" }).fill("親子丼");
  await page.locator("#view .row", { hasText: "親子丼" }).click();
  await page.getByRole("button", { name: "増やす" }).click();
  await expect(page.locator("table.ing tr", { hasText: "ごはん" })).toContainText("400g");
  await page.getByRole("button", { name: /買い物リストへ/ }).click();
  await closeToast(page);
  await tab(page, "買い物");
  await expect(page.locator(".check", { hasText: "ごはん" })).toContainText("400g");
  await expect(page.locator(".check", { hasText: "水" })).toHaveCount(0);
});

test("自分のレシピ: 空は保存しない・HTMLは文字として出す", async ({ page }) => {
  await page.goto("./#search");
  await page.getByRole("button", { name: /自分のレシピを追加/ }).click();
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByRole("alert")).toContainText("料理名を入れてください");

  await page.getByRole("textbox", { name: "料理名" }).fill('<b>テスト</b><img src=x onerror="alert(1)">');
  await page.getByRole("radio", { name: /副菜/ }).click();
  await page.getByRole("textbox", { name: "調理時間（分）" }).fill("５");
  await page.getByRole("textbox", { name: "材料1の名前" }).fill("卵");
  await page.getByRole("textbox", { name: "材料1の分量" }).fill("1個");
  await page.getByRole("textbox", { name: "作り方" }).fill("ゆでる\n切る");
  await page.getByRole("button", { name: "保存する" }).click();

  await expect(title(page)).toHaveText('<b>テスト</b><img src=x onerror="alert(1)">');
  await expect(page.locator("#view img, #title b, #title img")).toHaveCount(0);
  await expect(page.locator("ol.steps li")).toHaveCount(2);
});

test("作った！で写真を記録し、書き出し→別のブラウザで復元", async ({ page, browser }, testInfo) => {
  await planWeek(page);
  await page.getByRole("button", { name: "📷 作った！" }).first().click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /写真を撮る/ }).click();
  await (await chooser).setFiles({ name: "dish.png", mimeType: "image/png", buffer: await pngBuffer(page) });
  await expect(page.locator("#view img.photo")).toBeVisible();
  await expect(page.locator(".cal .day img")).toHaveCount(1);
  const size = await page.locator("#view img.photo").evaluate(img => [img.naturalWidth, img.naturalHeight]);
  expect(size).toEqual([1024, 768]);

  // APIキーを入れておき、書き出しファイルに入らないことを確かめる
  await tab(page, "設定");
  await page.getByLabel("Gemini APIキー").fill("TEST-KEY-should-not-export");
  await page.getByRole("button", { name: "保存", exact: true }).first().click();
  await closeToast(page);

  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: /書き出す/ }).click();
  const file = testInfo.outputPath("backup.kondate");
  await (await dl).saveAs(file);
  await closeToast(page);
  expect((await readFile(file)).includes("TEST-KEY")).toBeFalsy();

  // 別のブラウザ（データが空）で読み込む
  const other = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p2 = await other.newPage();
  await p2.goto("./#config");
  const ch2 = p2.waitForEvent("filechooser");
  await p2.getByRole("button", { name: "📥 読み込む" }).click();
  await (await ch2).setFiles(file);
  await expect(p2.locator("#modal h3")).toContainText("献立14件・写真1枚");
  await p2.getByRole("button", { name: "置き換える" }).click();
  await expect(p2.locator("#modal h3")).toHaveText("読み込みました");
  await closeToast(p2);
  await p2.locator(".tabbar a", { hasText: "カレンダー" }).click();
  await expect(p2.locator("#view img.photo")).toBeVisible();
  expect(await p2.evaluate(() => localStorage.getItem("kondate.geminiApiKey"))).toBeNull();
  await other.close();
});

test("ちがうファイルは読み込まない", async ({ page }) => {
  await planWeek(page);
  await page.goto("./#config");
  const ch = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "📥 読み込む" }).click();
  await (await ch).setFiles({ name: "memo.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await expect(page.locator("#modal h3")).toContainText("書き出しファイルではありません。今のデータはそのままです");
  await closeToast(page);
  await tab(page, "カレンダー");
  await expect(page.locator("#view .card").filter({ hasText: "なし" })).toHaveCount(0);
});

test("残り材料: 内蔵レシピとAI（通信はダミー）", async ({ page }) => {
  const calls = [];
  let status = 429;
  await page.route("https://generativelanguage.googleapis.com/**", async route => {
    calls.push({ url: route.request().url(), key: route.request().headers()["x-goog-api-key"] });
    if (status !== 200) return route.fulfill({ status, body: "{}" });
    const idea = { name: "卵とねぎの炒め物", genre: "chinese", minutes: 5, point: "すぐできる", ingredients: [{ name: "卵", amount: "2個" }], steps: ["炒める。", "盛る。"] };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ ideas: [idea] }) }] } }] }) });
  });

  await page.goto("./");
  await page.getByRole("button", { name: "残り材料で相談" }).click();
  const input = page.getByRole("textbox", { name: "残っている材料" });
  for (const x of ["たまご", "玉ねぎ", "とりにく"]) { await input.fill(x); await input.press("Enter"); }
  const rows = page.locator("#view .list .row");
  await expect(rows.filter({ hasText: "親子丼" })).toContainText("材料 3/4 一致・足りない：ごはん");

  // キーなし → 設定へ案内
  await page.getByRole("button", { name: /AIにも聞く/ }).click();
  await expect(page.locator("#modal h3")).toHaveText("AIのキーが設定されていません");
  await page.getByRole("button", { name: "設定を開く" }).click();
  await page.getByLabel("Gemini APIキー").fill("dummy-key");
  await page.getByRole("button", { name: "保存", exact: true }).first().click();
  await closeToast(page);
  await expect(page.getByLabel("Gemini APIキー")).toHaveValue(""); // キーは画面に出さない

  await tab(page, "きょう");
  await page.getByRole("button", { name: "残り材料で相談" }).click();
  await page.getByRole("button", { name: /AIにも聞く/ }).click();
  await expect(page.getByRole("alert")).toContainText("回数上限");
  await expect(rows.filter({ hasText: "親子丼" })).toHaveCount(1); // 内蔵の結果は残る

  status = 200;
  await page.getByRole("button", { name: /AIにも聞く/ }).click();
  await expect(page.locator("#view .card strong")).toHaveText("卵とねぎの炒め物");
  expect(calls[0].key).toBe("dummy-key");
  expect(calls.every(c => !c.url.includes("dummy-key"))).toBeTruthy();
});

test.describe("オフライン", () => {
  test.use({ serviceWorkers: "allow" });

  test("一度開けば、通信なしでも起動する", async ({ page, context }) => {
    await page.goto("./");
    await page.evaluate(() => navigator.serviceWorker.ready);
    // 初めて入ったときに勝手に再読み込みされない（入力中の内容が消えないように）
    await page.getByRole("button", { name: "残り材料で相談" }).click();
    await page.getByRole("textbox", { name: "残っている材料" }).fill("入力中");
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBeTruthy();
    await expect(page.getByRole("textbox", { name: "残っている材料" })).toHaveValue("入力中");
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("button", { name: "1週間分決める" })).toBeVisible();
    await page.getByRole("button", { name: "ランダム" }).click();
    await expect(page.getByRole("button", { name: /これにする/ })).toBeVisible();
    await context.setOffline(false);
  });
});
