// 内蔵レシピの自動検査（コンロ1口かどうかは自動で判定できないので docs/RECIPE_CHECKLIST.md で人が見る）
import { test } from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../../js/data/recipes.js";
import { GENRES, TOOLS } from "../../js/data/genres.js";
import { mainIngredients } from "../../js/lib/match.js";
import { scaleText } from "../../js/lib/scale.js";

// ジャンルごとの品数（合計100品）
const TARGET = { pasta: 15, don: 15, meat: 15, fish: 10, noodle: 12, western: 10, chinese: 10, soup: 8, side: 5 };
const FORBIDDEN = /オーブン|トースター|グリル|魚焼き/;

test("ジャンルごとの品数", () => {
  const count = {};
  for (const r of RECIPES) count[r.genre] = (count[r.genre] ?? 0) + 1;
  assert.deepEqual(count, TARGET);
  assert.equal(RECIPES.length, Object.values(TARGET).reduce((a, b) => a + b, 0));
});

test("id は重ならず「ジャンル-番号」の形", () => {
  assert.equal(new Set(RECIPES.map(r => r.id)).size, RECIPES.length);
  for (const r of RECIPES) assert.match(r.id, new RegExp(`^${r.genre}-\\d{3}$`), r.id);
});

test("料理名も重ならない", () => {
  assert.equal(new Set(RECIPES.map(r => r.name)).size, RECIPES.length);
});

for (const r of RECIPES) {
  test(`必須項目と台所の条件: ${r.name}`, () => {
    assert.ok(r.name.trim());
    assert.ok(GENRES.some(g => g.id === r.genre));
    assert.ok(Number.isInteger(r.minutes) && r.minutes >= 1 && r.minutes <= 90);
    assert.ok([1, 2, 3].includes(r.difficulty));
    assert.equal(r.servings, 1);
    assert.equal(r.custom, false);
    assert.ok(Array.isArray(r.tools));
    for (const t of r.tools) assert.ok(t in TOOLS, `知らない道具: ${t}`);

    assert.ok(r.ingredients.length >= 2);
    for (const i of r.ingredients) {
      assert.ok(i.name.trim());
      assert.ok(i.amount === null || (Number.isFinite(i.amount) && i.amount > 0), `${i.name} の分量`);
      assert.ok(typeof i.unit === "string");
      if (i.amount === null) assert.ok(i.unit, `${i.name}: 数値なしなら「少々」などを書く`);
      assert.ok(scaleText(i, 3));
    }
    assert.ok(mainIngredients(r).length >= 1, "調味料以外の材料が1つ以上");
    assert.equal(new Set(r.ingredients.map(i => i.name)).size, r.ingredients.length, "同じ材料が2回");

    assert.ok(r.steps.length >= 2);
    for (const s of r.steps) assert.ok(s.trim() && s.length <= 200);

    assert.ok(!FORBIDDEN.test(r.name + r.steps.join("")), "オーブン・トースター・グリルを使っている");

    // 手順に出てくる道具が tools に書いてあるか（表示の「フライパン」「レンジ」などと合わせる）
    const text = r.steps.join("");
    const uses = { microwave: /レンジ/, frypan: /フライパン/, pot: /鍋/ };
    for (const [tool, re] of Object.entries(uses)) {
      if (re.test(text)) assert.ok(r.tools.includes(tool), `手順で${TOOLS[tool]}を使うのに tools にない`);
    }
  });
}
