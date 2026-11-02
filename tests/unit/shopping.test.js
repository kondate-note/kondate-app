import { test } from "node:test";
import assert from "node:assert/strict";
import { addIngredients, removeChecked, newItem, itemAmountText, sortItems } from "../../js/lib/shopping.js";

const napolitan = [
  { name: "スパゲッティ", amount: 100, unit: "g" },
  { name: "玉ねぎ", amount: 0.25, unit: "個" },
  { name: "水", amount: 200, unit: "ml" },
  { name: "塩・こしょう", amount: null, unit: "少々" },
];

test("人数分を入れ、水は入れない", () => {
  const { list, added } = addIngredients([], napolitan, 2);
  assert.equal(added, 3);
  assert.deepEqual(list.map(i => [i.name, i.amount, i.unit]), [
    ["スパゲッティ", 200, "g"],
    ["玉ねぎ", 0.5, "個"],
    ["塩・こしょう", null, "少々"],
  ]);
});

test("同じ名前・同じ単位はまとめる", () => {
  let { list } = addIngredients([], napolitan, 1);
  ({ list } = addIngredients(list, napolitan, 1));
  assert.equal(list.length, 3);
  assert.equal(list.find(i => i.name === "スパゲッティ").amount, 200);
  assert.equal(list.find(i => i.name === "玉ねぎ").amount, 0.5);
});

test("単位が違えば別の行", () => {
  const { list } = addIngredients([], [
    { name: "玉ねぎ", amount: 1, unit: "個" },
    { name: "玉ねぎ", amount: 50, unit: "g" },
  ], 1);
  assert.equal(list.length, 2);
});

test("チェック済みの行には足さず、新しい行にする", () => {
  const start = [{ ...newItem("玉ねぎ", 1, "個"), checked: true }];
  const { list } = addIngredients(start, [{ name: "玉ねぎ", amount: 1, unit: "個" }], 1);
  assert.equal(list.length, 2);
  assert.equal(list[0].amount, 1);
});

test("元の配列は書きかえない", () => {
  const start = [newItem("玉ねぎ", 1, "個")];
  addIngredients(start, [{ name: "玉ねぎ", amount: 1, unit: "個" }], 1);
  assert.equal(start[0].amount, 1);
});

test("チェック済みを消す", () => {
  const list = [newItem("a"), { ...newItem("b"), checked: true }];
  assert.deepEqual(removeChecked(list).map(i => i.name), ["a"]);
});

test("表示のときに丸める", () => {
  const { list } = addIngredients([], [
    { name: "玉ねぎ", amount: 0.25, unit: "個" },
    { name: "しょうゆ", amount: 1.5, unit: "大さじ" },
    { name: "塩", amount: null, unit: "少々" },
  ], 1);
  assert.deepEqual(list.map(itemAmountText), ["0.5個", "大さじ1.5", "少々"]);
});

test("あとから入れたものは後ろに並ぶ", () => {
  let { list } = addIngredients([newItem("卵", 1, "パック", 5)], napolitan, 1);
  list = sortItems(list.reverse());
  assert.deepEqual(list.map(i => i.name), ["卵", "スパゲッティ", "玉ねぎ", "塩・こしょう"]);
});

test("id は UUID", () => {
  assert.match(newItem("卵").id, /^[0-9a-f-]{36}$/);
});
