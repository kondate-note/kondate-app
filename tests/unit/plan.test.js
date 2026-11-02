process.env.TZ = "Asia/Tokyo";

import { test } from "node:test";
import assert from "node:assert/strict";
import { mainPool, pickRandom, planWeek, mergePlan, makeMeal } from "../../js/lib/plan.js";

// 毎回同じ並びになる乱数（テスト用）
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
const make = n => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `料理${i}`, genre: "pasta" }));

test("ランダムの対象から副菜を除く", () => {
  const pool = mainPool([{ id: "a", genre: "pasta" }, { id: "b", genre: "side" }]);
  assert.deepEqual(pool.map(r => r.id), ["a"]);
});

test("対象0件なら null", () => {
  assert.equal(pickRandom([]), null);
});

test("除外が全部でも何か返す", () => {
  const pool = make(2);
  assert.ok(pickRandom(pool, { exclude: new Set(["r0", "r1"]) }));
});

test("1週間分は14枠、14品以上なら重ならない", () => {
  for (let s = 1; s <= 20; s++) {
    const plan = planWeek(make(20), new Date(2026, 10, 2), seeded(s));
    assert.equal(plan.length, 14);
    assert.equal(new Set(plan.map(p => p.recipe.id)).size, 14);
  }
});

test("14品未満なら一巡してから重ねる", () => {
  const plan = planWeek(make(5), new Date(2026, 10, 2), seeded(7));
  assert.equal(plan.length, 14);
  assert.equal(new Set(plan.slice(0, 5).map(p => p.recipe.id)).size, 5);
  const counts = {};
  for (const p of plan) counts[p.recipe.id] = (counts[p.recipe.id] ?? 0) + 1;
  assert.ok(Object.values(counts).every(c => c <= 3));
});

test("対象0件なら空", () => {
  assert.deepEqual(planWeek([], new Date()), []);
});

test("月末をまたぐ日付", () => {
  const plan = planWeek(make(14), new Date(2026, 11, 28), seeded(1));
  assert.deepEqual([...new Set(plan.map(p => p.date))],
    ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
});

test("「作った」記録は上書きせず、予定は id をそのまま上書き", () => {
  const [a, b] = make(2);
  const done = { ...makeMeal("2026-11-02", "lunch", a), done: true, photoId: "p1" };
  const planned = { ...makeMeal("2026-11-02", "dinner", a), photoId: "p2" };
  const plan = [
    { date: "2026-11-02", slot: "lunch", recipe: b },
    { date: "2026-11-02", slot: "dinner", recipe: b },
    { date: "2026-11-03", slot: "lunch", recipe: b },
  ];
  const { toSave, removePhotoIds, skipped } = mergePlan([done, planned], plan);
  assert.equal(skipped, 1);
  assert.equal(toSave.length, 2);
  assert.equal(toSave[0].id, planned.id);
  assert.equal(toSave[0].recipeName, "料理1");
  assert.deepEqual(removePhotoIds, ["p2"]);
});
