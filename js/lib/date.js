// 日付キー（"YYYY-MM-DD"）は必ずここで作る。端末の時刻を使い、toISOString（UTC）は使わない
const pad = n => String(n).padStart(2, "0");

export const DOW = ["日", "月", "火", "水", "木", "金", "土"];

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "YYYY-MM-DD" → その日の0時（端末の時刻）。形式が違えば null
export function parseDateKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key ?? "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return dateKey(d) === key ? d : null;
}

export function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

// "11月3日（月）"
export function dateLabel(d) {
  return `${d.getMonth() + 1}月${d.getDate()}日（${DOW[d.getDay()]}）`;
}
