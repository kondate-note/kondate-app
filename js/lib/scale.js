// 人数計算。レシピの分量は1人分で持ち、表示のときに人数を掛ける
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 6;

const WHOLE_UNITS = ["g", "ml", "cc"];        // 整数で表示
const PREFIX_UNITS = ["大さじ", "小さじ"];     // 「大さじ1.5」のように単位を先に書く

export function clampServings(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return MIN_SERVINGS;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, v));
}

// 数値なし（少々・適量）は null のまま。単位ごとに丸める
export function scaleAmount(amount, unit, servings) {
  if (amount == null || !Number.isFinite(Number(amount))) return null;
  const v = Number(amount) * servings;
  if (v <= 0) return 0;
  if (WHOLE_UNITS.includes(unit)) return Math.max(1, Math.round(v));
  return Math.max(0.5, Math.round(v * 2) / 2);
}

// 0.5刻みの数を文字にする（1 → "1"、1.5 → "1.5"）
export function formatNumber(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function amountText(amount, unit) {
  if (amount == null) return unit ?? "";
  const num = formatNumber(amount);
  return PREFIX_UNITS.includes(unit) ? `${unit}${num}` : `${num}${unit ?? ""}`;
}

export function scaleText(ing, servings) {
  return amountText(scaleAmount(ing.amount, ing.unit, servings), ing.unit);
}
