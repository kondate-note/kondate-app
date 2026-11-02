import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBackup, parseBackup, summarize, backupFileName, MAGIC } from "../../js/lib/backup.js";

// 0〜255 のすべての値を含む、写真のかわりのデータ
function fakePhoto(id, size, seed) {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = (i * 31 + seed) % 256;
  return { id, blob: new Blob([bytes], { type: "image/jpeg" }), createdAt: 1 };
}

const sample = () => ({
  recipes: [{ id: "my-1", name: "<b>卵かけごはん</b>", genre: "don", minutes: 3, ingredients: [{ name: "卵", amount: 1, unit: "個" }], steps: ["のせる"], custom: true }],
  meals: [
    { id: "m1", date: "2026-11-02", slot: "lunch", recipeId: "my-1", recipeName: "卵かけごはん", servings: 1, done: true, photoId: "p1", memo: "" },
    { id: "m2", date: "2026-11-02", slot: "dinner", recipeId: "don-001", recipeName: "親子丼", servings: 2, done: true, photoId: "p2", memo: "" },
    { id: "m3", date: "2026-11-03", slot: "lunch", recipeId: "don-001", recipeName: "親子丼", servings: 1, done: false, photoId: null, memo: "" },
  ],
  photos: [fakePhoto("p1", 5000, 1), fakePhoto("p2", 70001, 2), fakePhoto("p3", 0, 3)],
  shopping: [{ id: "s1", name: "卵", amount: 2, unit: "個", checked: false, seq: 1 }],
  settings: [{ key: "geminiModel", value: "gemini-2.5-flash" }, { key: "geminiApiKey", value: "SECRET" }],
});

async function bytesOf(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

async function code(p) {
  try { await p; } catch (e) { return e.code; }
  return "NO_ERROR";
}

test("書き出し→読み込みで元に戻り、写真は1バイトも変わらない", async () => {
  const src = sample();
  const back = await parseBackup(buildBackup(src));
  assert.deepEqual(back.recipes, src.recipes);
  assert.deepEqual(back.meals, src.meals);
  assert.deepEqual(back.shopping, src.shopping);
  assert.equal(back.photos.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(back.photos[i].id, src.photos[i].id);
    assert.equal(back.photos[i].blob.type, "image/jpeg");
    assert.deepEqual(await bytesOf(back.photos[i].blob), await bytesOf(src.photos[i].blob));
  }
});

test("APIキーらしき設定は書き出さず、読み込みでも無視する", async () => {
  const file = buildBackup(sample());
  const text = new TextDecoder().decode(await bytesOf(file));
  assert.ok(!text.includes("SECRET"));
  const back = await parseBackup(file);
  assert.deepEqual(back.settings, [{ key: "geminiModel", value: "gemini-2.5-flash" }]);
});

test("ファイルの中のキーも無視する", async () => {
  const hdr = { app: "kondate", version: 1, recipes: [], meals: [], shopping: [], photos: [], settings: [{ key: "apiKey", value: "x" }] };
  const back = await parseBackup(raw(hdr));
  assert.deepEqual(back.settings, []);
});

test("空のデータでも書き出せる", async () => {
  const back = await parseBackup(buildBackup({}));
  assert.deepEqual(summarize(back), { recipes: 0, meals: 0, done: 0, photos: 0, shopping: 0 });
});

test("ちがうファイル", async () => {
  assert.equal(await code(parseBackup(new Blob(["hello"]))), "NOT_BACKUP");
  assert.equal(await code(parseBackup(new Blob([new Uint8Array(100)]))), "NOT_BACKUP");
  assert.equal(await code(parseBackup(new Blob(['{"app":"kondate"}']))), "NOT_BACKUP");
  assert.equal(await code(parseBackup(null)), "NOT_BACKUP");
});

test("途中で切れたファイル・余分なデータ", async () => {
  const full = await bytesOf(buildBackup(sample()));
  for (const cut of [20, 100, full.length - 1]) {
    assert.equal(await code(parseBackup(new Blob([full.slice(0, cut)]))), "BROKEN", `cut=${cut}`);
  }
  assert.equal(await code(parseBackup(new Blob([full, new Uint8Array([0])]))), "BROKEN");
});

// ヘッダを自由に作ってファイルにする
function raw(header, extra = []) {
  const hb = new TextEncoder().encode(typeof header === "string" ? header : JSON.stringify(header));
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, hb.length);
  return new Blob([MAGIC, len, hb, ...extra]);
}
const base = { app: "kondate", version: 1, recipes: [], meals: [], shopping: [], photos: [], settings: [] };

test("壊れたヘッダ", async () => {
  assert.equal(await code(parseBackup(raw("{not json"))), "BROKEN");
  assert.equal(await code(parseBackup(raw({ ...base, app: "other" }))), "NOT_BACKUP");
  assert.equal(await code(parseBackup(raw({ ...base, meals: "x" }))), "BROKEN");
  assert.equal(await code(parseBackup(raw({ ...base, meals: [{ id: "a", date: "2026-13-01", slot: "lunch", recipeName: "x" }] }))), "BROKEN");
  assert.equal(await code(parseBackup(raw({ ...base, meals: [{ id: "a", date: "2026-11-01", slot: "breakfast", recipeName: "x" }] }))), "BROKEN");
  const m = { id: "a", date: "2026-11-01", slot: "lunch", recipeName: "x" };
  assert.equal(await code(parseBackup(raw({ ...base, meals: [m, { ...m, id: "b" }] }))), "BROKEN");
  assert.equal(await code(parseBackup(raw({ ...base, photos: [{ id: "p", type: "image/jpeg", size: -1 }] }))), "BROKEN");
});

test("版のちがい", async () => {
  assert.equal(await code(parseBackup(raw({ ...base, version: 2 }))), "NEWER_VERSION");
  assert.equal(await code(parseBackup(raw({ ...base, version: "1" }))), "BROKEN");
});

test("写真のない記録は写真なしにする", async () => {
  const hdr = { ...base, meals: [{ id: "a", date: "2026-11-01", slot: "lunch", recipeName: "x", photoId: "nope" }] };
  const back = await parseBackup(raw(hdr));
  assert.equal(back.meals[0].photoId, null);
});

test("ファイル名は端末の時刻", () => {
  assert.equal(backupFileName(new Date(2026, 10, 2, 7, 5)), "kondate-20261102-0705.kondate");
});
