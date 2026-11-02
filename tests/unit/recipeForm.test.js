import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, formToRecipe, recipeToForm, emptyForm } from "../../js/lib/recipeForm.js";

test("分量の読み取り", () => {
  assert.deepEqual(parseAmount("100g"), { amount: 100, unit: "g" });
  assert.deepEqual(parseAmount("１００ｇ"), { amount: 100, unit: "g" });
  assert.deepEqual(parseAmount("大さじ1.5"), { amount: 1.5, unit: "大さじ" });
  assert.deepEqual(parseAmount("小さじ 1/2"), { amount: 0.5, unit: "小さじ" });
  assert.deepEqual(parseAmount("1/4個"), { amount: 0.25, unit: "個" });
  assert.deepEqual(parseAmount("½個"), { amount: 0.5, unit: "個" });
  assert.deepEqual(parseAmount("2 本"), { amount: 2, unit: "本" });
  assert.deepEqual(parseAmount("3"), { amount: 3, unit: "" });
});

test("数値でない分量は人数で変えない", () => {
  assert.deepEqual(parseAmount("少々"), { amount: null, unit: "少々" });
  assert.deepEqual(parseAmount("大さじ"), { amount: null, unit: "大さじ" });
  assert.deepEqual(parseAmount("0個"), { amount: null, unit: "0個" });
  assert.deepEqual(parseAmount("1/0個"), { amount: null, unit: "1/0個" });
  assert.deepEqual(parseAmount(""), { amount: null, unit: "" });
});

const ok = {
  name: "  卵かけごはん ", genre: "don", minutes: "５",
  ingredients: [{ name: "ごはん", amount: "200g" }, { name: "", amount: "" }, { name: "しょうゆ", amount: "少々" }],
  steps: "ごはんに卵をのせる\n\n しょうゆをかける ",
};

test("正しい入力はレシピになる", () => {
  const { errors, recipe } = formToRecipe(ok);
  assert.deepEqual(errors, []);
  assert.equal(recipe.name, "卵かけごはん");
  assert.equal(recipe.minutes, 5);
  assert.equal(recipe.ingredients.length, 2);
  assert.deepEqual(recipe.steps, ["ごはんに卵をのせる", "しょうゆをかける"]);
  assert.equal(recipe.custom, true);
  assert.match(recipe.id, /^my-[0-9a-f-]{36}$/);
});

test("編集のときは id を引き継ぐ", () => {
  assert.equal(formToRecipe(ok, "my-x").recipe.id, "my-x");
});

test("空のまま保存すると足りない項目を全部出す", () => {
  const { errors, recipe } = formToRecipe(emptyForm());
  assert.equal(recipe, undefined);
  assert.deepEqual(errors, [
    "料理名を入れてください",
    "ジャンルをえらんでください",
    "調理時間を入れてください",
    "材料を1つ以上入れてください",
    "作り方を1行以上入れてください",
  ]);
});

test("おかしな値", () => {
  const bad = { ...ok, genre: "oven", minutes: "-3", ingredients: [{ name: "", amount: "100g" }] };
  const { errors } = formToRecipe(bad);
  assert.ok(errors.includes("ジャンルをえらんでください"));
  assert.ok(errors.includes("調理時間は1〜600の数字（分）で入れてください"));
  assert.ok(errors.includes("分量だけで材料名が空の行があります"));
});

test("HTMLのような文字もそのまま文字として保存する", () => {
  const xss = '<img src=x onerror="alert(1)">';
  const { recipe } = formToRecipe({ ...ok, name: xss.slice(0, 40), steps: xss });
  assert.equal(recipe.steps[0], xss);
});

test("編集画面に戻して、もう一度保存すると同じになる", () => {
  const { recipe } = formToRecipe({ ...ok, ingredients: [{ name: "しょうゆ", amount: "大さじ1.5" }, { name: "玉ねぎ", amount: "1/4個" }] });
  const again = formToRecipe(recipeToForm(recipe), recipe.id).recipe;
  assert.deepEqual(again, recipe);
});
