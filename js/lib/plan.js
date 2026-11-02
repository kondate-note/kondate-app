// 献立を決めるロジック（ランダム・1週間分）。画面や保存には触らない
import { dateKey, addDays } from "./date.js";

export const SLOTS = ["lunch", "dinner"];
export const slotLabel = slot => (slot === "lunch" ? "昼" : "夜");

// ランダムの対象は副菜以外
export function mainPool(recipes) {
  return recipes.filter(r => r.genre !== "side");
}

// exclude に入っていないものから選ぶ。全部入っていたら全体から選ぶ。対象が0件なら null
export function pickRandom(pool, { exclude = new Set(), rng = Math.random } = {}) {
  if (!pool.length) return null;
  const rest = pool.filter(r => !exclude.has(r.id));
  const src = rest.length ? rest : pool;
  return src[Math.floor(rng() * src.length)];
}

// start の日から7日分×昼夜。対象が14品以上なら重ならない。足りなければ一巡してから重ねる
export function planWeek(pool, start, rng = Math.random) {
  const out = [];
  if (!pool.length) return out;
  const used = new Set();
  for (let i = 0; i < 7; i++) {
    const date = dateKey(addDays(start, i));
    for (const slot of SLOTS) {
      if (used.size >= pool.length) used.clear();
      const recipe = pickRandom(pool, { exclude: used, rng });
      used.add(recipe.id);
      out.push({ date, slot, recipe });
    }
  }
  return out;
}

// 料理名もコピーして持つ（レシピを消しても記録が残るように）
export function makeMeal(date, slot, recipe, current = null, servings = 1) {
  return {
    id: current?.id ?? crypto.randomUUID(),
    date, slot,
    recipeId: recipe.id,
    recipeName: recipe.name,
    servings,
    done: false,
    photoId: null,
    memo: "",
  };
}

// 1週間分を今ある献立に重ねる。「作った」記録は上書きしない
export function mergePlan(existing, plan) {
  const byKey = new Map(existing.map(m => [`${m.date}|${m.slot}`, m]));
  const toSave = [];
  const removePhotoIds = [];
  let skipped = 0;
  for (const p of plan) {
    const cur = byKey.get(`${p.date}|${p.slot}`);
    if (cur?.done) { skipped++; continue; }
    if (cur?.photoId) removePhotoIds.push(cur.photoId);
    toSave.push(makeMeal(p.date, p.slot, p.recipe, cur));
  }
  return { toSave, removePhotoIds, skipped };
}
