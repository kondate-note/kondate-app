import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeName, sameIngredient, isSeasoning, rankByLeftovers } from "../../js/lib/match.js";
import { RECIPES } from "../../js/data/recipes.js";

test("表記をそろえる", () => {
  assert.equal(normalizeName("キャベツ"), "きゃべつ");
  assert.equal(normalizeName("ｷｬﾍﾞﾂ"), "きゃべつ");
  assert.equal(normalizeName("めんつゆ（3倍）"), "めんつゆ");
  assert.equal(normalizeName(" 豚 こま "), "豚こま");
});

test("表記ゆれを同じ材料とみなす", () => {
  assert.ok(sameIngredient("豚こま肉", "豚肉"));
  assert.ok(sameIngredient("豚バラ", "豚こま"));
  assert.ok(sameIngredient("たまご", "卵"));
  assert.ok(sameIngredient("鶏もも肉", "とりにく"));
  assert.ok(sameIngredient("ジャガイモ", "じゃがいも"));
  assert.ok(sameIngredient("にんじん", "人参"));
});

test("似ていても別の材料", () => {
  assert.ok(!sameIngredient("玉ねぎ", "長ねぎ"));
  assert.ok(!sameIngredient("ねぎ", "玉ねぎ"));
  assert.ok(!sameIngredient("鶏肉", "豚肉"));
  assert.ok(!sameIngredient("", "卵"));
});

test("調味料は照合で数えない", () => {
  assert.ok(isSeasoning({ name: "しょうゆ" }));
  assert.ok(isSeasoning({ name: "麻婆豆腐の素" }));
  assert.ok(isSeasoning({ name: "めんつゆ（3倍）" }));
  assert.ok(!isSeasoning({ name: "キャベツ" }));
});

test("一致率の高い順に並ぶ", () => {
  const res = rankByLeftovers(RECIPES, ["たまご", "玉ねぎ", "とりにく", "ごはん"]);
  assert.equal(res[0].recipe.name, "親子丼");
  assert.equal(res[0].rate, 1);
  assert.deepEqual(res[0].missing, []);
  assert.ok(res.every(x => x.hit > 0));
  for (let i = 1; i < res.length; i++) assert.ok(res[i - 1].rate >= res[i].rate);
});

test("足りない材料がわかる", () => {
  const r = rankByLeftovers(RECIPES, ["キャベツ"]).find(x => x.recipe.name === "焼うどん");
  assert.deepEqual(r.missing, ["冷凍うどん", "豚こま肉"]);
});

test("材料が空・一致なしなら何も出さない", () => {
  assert.deepEqual(rankByLeftovers(RECIPES, []), []);
  assert.deepEqual(rankByLeftovers(RECIPES, ["  "]), []);
  assert.deepEqual(rankByLeftovers(RECIPES, ["ドラゴンフルーツ"]), []);
});
