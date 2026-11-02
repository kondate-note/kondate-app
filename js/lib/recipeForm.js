// 自分のレシピの入力を読み取り、足りない項目を調べる。画面や保存には触らない
import { GENRES } from "../data/genres.js";

const PREFIX_UNITS = ["大さじ", "小さじ", "カップ"];
export const LIMITS = { name: 40, ingredientName: 30, amount: 20, step: 300, steps: 30, ingredients: 30 };

// 全角数字・「½」などを普通の文字に
function normalize(s) {
  return String(s ?? "").normalize("NFKC").replace(/⁄/g, "/").trim();
}

function parseNumber(s) {
  const m = /^(\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?$/.exec(s);
  if (!m) return null;
  const v = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 10000) / 10000 : null;
}

// "100g" → {100,"g"}、"大さじ1.5" → {1.5,"大さじ"}、"1/2個" → {0.5,"個"}、"少々" → {null,"少々"}
export function parseAmount(text) {
  const s = normalize(text);
  if (!s) return { amount: null, unit: "" };
  for (const u of PREFIX_UNITS) {
    if (s.startsWith(u)) {
      const n = parseNumber(s.slice(u.length).trim());
      if (n != null) return { amount: n, unit: u };
    }
  }
  const m = /^(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)\s*(.*)$/.exec(s);
  if (m) {
    const n = parseNumber(m[1]);
    if (n != null) return { amount: n, unit: m[2].trim() };
  }
  return { amount: null, unit: s };
}

// 編集画面に戻すとき用。表示用の丸め（0.25 → 0.3）をすると保存しなおしたときに量が変わるので、そのままの数で
export function formatAmount(ing) {
  if (ing.amount == null) return ing.unit ?? "";
  const n = String(ing.amount);
  return PREFIX_UNITS.includes(ing.unit) ? `${ing.unit}${n}` : `${n}${ing.unit ?? ""}`;
}

export function emptyForm() {
  return { name: "", genre: null, minutes: "", ingredients: [{ name: "", amount: "" }, { name: "", amount: "" }, { name: "", amount: "" }], steps: "" };
}

export function recipeToForm(r) {
  return {
    name: r.name,
    genre: r.genre,
    minutes: String(r.minutes ?? ""),
    ingredients: r.ingredients.map(i => ({ name: i.name, amount: formatAmount(i) })),
    steps: r.steps.join("\n"),
  };
}

// 戻り値: { errors: [...] } か { recipe }
export function formToRecipe(form, id) {
  const errors = [];
  const name = normalizeText(form.name);
  if (!name) errors.push("料理名を入れてください");
  else if (name.length > LIMITS.name) errors.push(`料理名は${LIMITS.name}文字までです`);

  if (!GENRES.some(g => g.id === form.genre)) errors.push("ジャンルをえらんでください");

  const minutesText = normalize(form.minutes);
  const minutes = /^\d+$/.test(minutesText) ? Number(minutesText) : NaN;
  if (!minutesText) errors.push("調理時間を入れてください");
  else if (!(minutes >= 1 && minutes <= 600)) errors.push("調理時間は1〜600の数字（分）で入れてください");

  const ingredients = [];
  let noName = false;
  let tooLong = false;
  for (const row of form.ingredients) {
    const n = normalizeText(row.name);
    const a = normalizeText(row.amount);
    if (!n && !a) continue;
    if (!n) { noName = true; continue; }
    if (n.length > LIMITS.ingredientName || a.length > LIMITS.amount) tooLong = true;
    ingredients.push({ name: n, ...parseAmount(a) });
  }
  if (noName) errors.push("分量だけで材料名が空の行があります");
  if (tooLong) errors.push(`材料名は${LIMITS.ingredientName}文字、分量は${LIMITS.amount}文字までです`);
  if (!ingredients.length) errors.push("材料を1つ以上入れてください");
  if (ingredients.length > LIMITS.ingredients) errors.push(`材料は${LIMITS.ingredients}個までです`);

  const steps = String(form.steps ?? "").split(/\r?\n/).map(normalizeText).filter(Boolean);
  if (!steps.length) errors.push("作り方を1行以上入れてください");
  if (steps.length > LIMITS.steps) errors.push(`作り方は${LIMITS.steps}行までです`);
  if (steps.some(s => s.length > LIMITS.step)) errors.push(`作り方の1行は${LIMITS.step}文字までです`);

  if (errors.length) return { errors };
  return {
    errors: [],
    recipe: {
      id: id ?? `my-${crypto.randomUUID()}`,
      name, genre: form.genre, minutes, difficulty: null, servings: 1,
      ingredients, steps, tools: [], custom: true,
    },
  };
}

// 前後の空白を消すだけ（全角英数は利用者の書いたまま残す）
function normalizeText(s) {
  return String(s ?? "").trim();
}
