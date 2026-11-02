// Gemini API（無料枠）への相談。送るのは材料名と条件だけ
// キーは x-goog-api-key ヘッダで送る（URLに入れない）。console にも出さない
import { GENRES } from "../data/genres.js";

export const DEFAULT_MODEL = "gemini-2.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/";
const TIMEOUT_MS = 30000;

export const KITCHEN = "1人分、オーブン・トースター・魚焼きグリルは使わない、コンロは1口（同時に2つ火を使わない）、電子レンジと炊飯器とフライパンと鍋は使える";

export class GeminiError extends Error {
  constructor(code, detail = "") {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

// 画面に出す言葉
export const ERROR_TEXT = {
  NO_KEY: "AIのキーが設定されていません。設定画面で入れてください",
  BAD_MODEL: "モデル名の形が正しくありません。設定画面で確認してください",
  AUTH: "AIのキーが正しくないか、使えない設定です。設定画面で確認してください",
  RATE_LIMIT: "今は使えません（無料枠の回数上限）。しばらくしてからためしてください",
  MODEL: "このモデルは使えなくなっています。設定画面でモデル名を変えてください",
  SERVER: "今は使えません（AI側の不調）。しばらくしてからためしてください",
  TIMEOUT: "今は使えません（返事が来ませんでした）。通信のよい所でためしてください",
  OFFLINE: "今は使えません（インターネットにつながっていません）",
  BLOCKED: "AIが答えられない内容でした。材料を変えてためしてください",
  BAD_REPLY: "AIの返事を読み取れませんでした。もう一度ためしてください",
  BAD_REQUEST: "今は使えません（送った内容に問題がありました）",
};

export function errorText(e) {
  return ERROR_TEXT[e?.code] ?? "今は使えません。しばらくしてからためしてください";
}

export function validModel(model) {
  return /^[a-z0-9][a-z0-9.\-]{0,63}$/i.test(model ?? "");
}

// 返してほしいJSONの形（構造化出力）
const SCHEMA = {
  type: "OBJECT",
  properties: {
    ideas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          genre: { type: "STRING", enum: GENRES.map(g => g.id) },
          minutes: { type: "INTEGER" },
          point: { type: "STRING" },
          ingredients: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { name: { type: "STRING" }, amount: { type: "STRING" } },
              required: ["name", "amount"],
            },
          },
          steps: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["name", "genre", "minutes", "point", "ingredients", "steps"],
      },
    },
  },
  required: ["ideas"],
};

export function buildPrompt(ingredients) {
  const list = ingredients.map(s => String(s).replace(/[\r\n]/g, " ").slice(0, 30)).slice(0, 20).join("、");
  return [
    `家にある材料: ${list}`,
    "これらをなるべく使う、家庭向けの料理を3つ提案してください。",
    `条件: ${KITCHEN}。`,
    "材料の分量は「100g」「大さじ1」「1/2個」「少々」のように書く。",
    "作り方は1つの手順を1つの文にし、装飾記号（*や#）は使わない。",
    "point には、この料理のおすすめを1文で書く。",
    `genre は次から選ぶ: ${GENRES.map(g => `${g.id}=${g.name}`).join(", ")}`,
  ].join("\n");
}

// 戻り値: [{ name, genre, minutes, point, ingredients:[{name, amount}], steps:[] }]
export async function askIdeas({ apiKey, model = DEFAULT_MODEL, ingredients, fetchImpl = fetch, timeoutMs = TIMEOUT_MS }) {
  if (!apiKey) throw new GeminiError("NO_KEY");
  if (!validModel(model)) throw new GeminiError("BAD_MODEL");
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new GeminiError("OFFLINE");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetchImpl(`${ENDPOINT}${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(ingredients) }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.8 },
      }),
      signal: ctrl.signal,
      referrerPolicy: "origin", // キーの「使えるサイト」制限のため、送り元のサイト名だけ送る
    });
  } catch (e) {
    if (e?.name === "AbortError") throw new GeminiError("TIMEOUT");
    throw new GeminiError("OFFLINE");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new GeminiError("RATE_LIMIT");
    if (res.status === 401 || res.status === 403) throw new GeminiError("AUTH");
    if (res.status === 400 && /API[_ ]?key/i.test(body)) throw new GeminiError("AUTH");
    if (res.status === 404) throw new GeminiError("MODEL");
    if (res.status >= 500) throw new GeminiError("SERVER");
    throw new GeminiError("BAD_REQUEST", String(res.status));
  }

  let data;
  try { data = await res.json(); } catch { throw new GeminiError("BAD_REPLY"); }
  if (data?.promptFeedback?.blockReason) throw new GeminiError("BLOCKED");
  const cand = data?.candidates?.[0];
  if (!cand || ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "RECITATION"].includes(cand.finishReason)) {
    throw new GeminiError(cand ? "BLOCKED" : "BAD_REPLY");
  }
  const text = (cand.content?.parts ?? []).map(p => p.text ?? "").join("");
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new GeminiError("BAD_REPLY"); }
  const ideas = Array.isArray(parsed?.ideas) ? parsed.ideas.filter(isIdea) : [];
  if (!ideas.length) throw new GeminiError("BAD_REPLY");
  return ideas.slice(0, 5);
}

function isIdea(x) {
  return x && typeof x.name === "string" && Array.isArray(x.ingredients) && Array.isArray(x.steps);
}

// AIの案を自分のレシピの入力の形に（保存前のチェックは recipeForm に任せる）
export function ideaToForm(idea) {
  return {
    name: String(idea.name ?? ""),
    genre: GENRES.some(g => g.id === idea.genre) ? idea.genre : null,
    minutes: String(idea.minutes ?? ""),
    ingredients: idea.ingredients.map(i => ({ name: String(i?.name ?? ""), amount: String(i?.amount ?? "") })),
    steps: idea.steps.map(s => String(s)).join("\n"),
  };
}

// 台所の条件に合わない道具が手順に出ていないか
export function usesForbiddenTool(idea) {
  return /オーブン|トースター|グリル/.test(idea.steps.join("") + (idea.name ?? ""));
}
