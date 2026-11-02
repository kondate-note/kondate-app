// 買い物リストの合算。同じ名前・同じ単位で、まだチェックしていないものにまとめる
// 分量は丸めずに持ち、表示のときだけ丸める（丸めてから足すと 1/4個+1/4個 が1個になるため）
import { scaleAmount, amountText } from "./scale.js";

const SKIP = ["水", "お湯", "湯"]; // 買わなくていいもの

// seq は並び順（id はランダムなので並びに使えない）
export function newItem(name, amount = null, unit = "", seq = 0) {
  return { id: crypto.randomUUID(), name: name.trim(), amount, unit, checked: false, seq };
}

export function nextSeq(list) {
  return list.reduce((max, it) => Math.max(max, it.seq ?? 0), 0) + 1;
}

export function sortItems(list) {
  return [...list].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

// レシピの材料を人数分にして、リストに足した新しい配列を返す（元の配列は変えない）
export function addIngredients(list, ingredients, servings) {
  const next = list.map(it => ({ ...it }));
  let seq = nextSeq(next);
  let added = 0;
  for (const ing of ingredients) {
    const name = (ing.name ?? "").trim();
    if (!name || SKIP.includes(name)) continue;
    const unit = ing.unit ?? "";
    const amount = Number.isFinite(ing.amount) ? tidy(ing.amount * servings) : null;
    const same = next.find(it => !it.checked && it.name === name && it.unit === unit);
    if (same) {
      if (same.amount != null && amount != null) same.amount = tidy(same.amount + amount);
      else if (same.amount == null && amount != null) same.amount = amount;
    } else {
      next.push(newItem(name, amount, unit, seq++));
    }
    added++;
  }
  return { list: next, added };
}

// 小数の誤差（0.1 + 0.2 = 0.30000000000000004 など）を消す
function tidy(n) {
  return Math.round(n * 10000) / 10000;
}

export function itemAmountText(it) {
  return amountText(scaleAmount(it.amount, it.unit, 1), it.unit);
}

export function removeChecked(list) {
  return list.filter(it => !it.checked);
}
