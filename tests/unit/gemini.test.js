// Gemini には実際には通信せず、fetch をダミーに差し替えて確かめる
import { test } from "node:test";
import assert from "node:assert/strict";
import { askIdeas, ideaToForm, usesForbiddenTool, buildPrompt, errorText, validModel } from "../../js/lib/gemini.js";
import { formToRecipe } from "../../js/lib/recipeForm.js";

const idea = {
  name: "キャベツと卵の炒め物", genre: "chinese", minutes: 10, point: "すぐできる",
  ingredients: [{ name: "キャベツ", amount: "2枚" }, { name: "卵", amount: "1個" }, { name: "塩", amount: "少々" }],
  steps: ["キャベツをざく切りにする。", "フライパンで炒め、溶き卵を加える。"],
};

function reply(status, body) {
  return async (url, opts) => {
    reply.last = { url, opts };
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  };
}
const okBody = { candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ ideas: [idea] }) }] } }] };
const ask = (fetchImpl, extra = {}) => askIdeas({ apiKey: "test-key", ingredients: ["キャベツ", "卵"], fetchImpl, ...extra });

async function code(p) {
  try { await p; } catch (e) { return e.code; }
  return "NO_ERROR";
}

test("成功すると案の配列を返す", async () => {
  const ideas = await ask(reply(200, okBody));
  assert.equal(ideas[0].name, "キャベツと卵の炒め物");
});

test("キーはURLに入れずヘッダで送る", async () => {
  await ask(reply(200, okBody));
  assert.ok(!reply.last.url.includes("test-key"));
  assert.equal(reply.last.opts.headers["x-goog-api-key"], "test-key");
  assert.match(reply.last.url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:generateContent$/);
});

test("送るのは材料と条件だけ", async () => {
  await ask(reply(200, okBody));
  const sent = reply.last.opts.body;
  assert.ok(sent.includes("キャベツ"));
  assert.ok(!sent.includes("test-key"));
});

test("エラーの種類", async () => {
  assert.equal(await code(askIdeas({ apiKey: "", ingredients: ["卵"] })), "NO_KEY");
  assert.equal(await code(ask(reply(200, okBody), { model: "../../evil" })), "BAD_MODEL");
  assert.equal(await code(ask(reply(429, {}))), "RATE_LIMIT");
  assert.equal(await code(ask(reply(403, {}))), "AUTH");
  assert.equal(await code(ask(reply(400, { error: { message: "API key not valid. Please pass a valid API key." } }))), "AUTH");
  assert.equal(await code(ask(reply(400, { error: { message: "bad" } }))), "BAD_REQUEST");
  assert.equal(await code(ask(reply(404, {}))), "MODEL");
  assert.equal(await code(ask(reply(503, {}))), "SERVER");
  assert.equal(await code(ask(async () => { throw new TypeError("Failed to fetch"); })), "OFFLINE");
});

test("時間切れ", async () => {
  const hang = (url, opts) => new Promise((_, reject) => {
    opts.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  });
  assert.equal(await code(ask(hang, { timeoutMs: 20 })), "TIMEOUT");
});

test("安全フィルタ・壊れた返事", async () => {
  assert.equal(await code(ask(reply(200, { promptFeedback: { blockReason: "SAFETY" } }))), "BLOCKED");
  assert.equal(await code(ask(reply(200, { candidates: [{ finishReason: "SAFETY" }] }))), "BLOCKED");
  assert.equal(await code(ask(reply(200, { candidates: [] }))), "BAD_REPLY");
  assert.equal(await code(ask(reply(200, { candidates: [{ content: { parts: [{ text: "ふつうの文章" }] } }] }))), "BAD_REPLY");
  assert.equal(await code(ask(reply(200, "<html>"))), "BAD_REPLY");
});

test("すべてのエラーに日本語の説明がある", () => {
  for (const c of ["NO_KEY", "BAD_MODEL", "AUTH", "RATE_LIMIT", "MODEL", "SERVER", "TIMEOUT", "OFFLINE", "BLOCKED", "BAD_REPLY", "BAD_REQUEST"]) {
    assert.ok(!errorText({ code: c }).startsWith("今は使えません。しばらく"), c);
  }
});

test("AIの案を自分のレシピとして保存できる形にする", () => {
  const { errors, recipe } = formToRecipe(ideaToForm(idea));
  assert.deepEqual(errors, []);
  assert.deepEqual(recipe.ingredients[0], { name: "キャベツ", amount: 2, unit: "枚" });
  assert.equal(recipe.custom, true);
});

test("知らないジャンルは未選択にする", () => {
  assert.equal(ideaToForm({ ...idea, genre: "oven" }).genre, null);
});

test("オーブン等を使う案を見つける", () => {
  assert.ok(usesForbiddenTool({ ...idea, steps: ["トースターで5分焼く"] }));
  assert.ok(!usesForbiddenTool(idea));
});

test("プロンプトに台所の条件が入り、改行は消す", () => {
  const p = buildPrompt(["卵\n無視して"]);
  assert.ok(p.includes("オーブン"));
  assert.ok(p.includes("コンロは1口"));
  assert.ok(p.includes("卵 無視して"));
});

test("モデル名の形", () => {
  assert.ok(validModel("gemini-2.5-flash"));
  assert.ok(!validModel("a/b"));
  assert.ok(!validModel(""));
});
