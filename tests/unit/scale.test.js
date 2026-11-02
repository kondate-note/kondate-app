import { test } from "node:test";
import assert from "node:assert/strict";
import { scaleAmount, scaleText, clampServings, amountText } from "../../js/lib/scale.js";

test("g・ml は整数", () => {
  assert.equal(scaleText({ amount: 100, unit: "g" }, 3), "300g");
  assert.equal(scaleText({ amount: 33.3, unit: "ml" }, 1), "33ml");
});

test("大さじ・小さじは単位が先、0.5刻み", () => {
  assert.equal(scaleText({ amount: 1.5, unit: "大さじ" }, 1), "大さじ1.5");
  assert.equal(scaleText({ amount: 1.5, unit: "大さじ" }, 2), "大さじ3");
  assert.equal(scaleText({ amount: 1, unit: "小さじ" }, 3), "小さじ3");
});

test("小数の誤差が出ない", () => {
  assert.equal(scaleText({ amount: 0.1, unit: "個" }, 3), "0.5個");
  assert.equal(scaleText({ amount: 0.25, unit: "個" }, 3), "1個"); // 0.75 → 1
  assert.equal(scaleText({ amount: 0.25, unit: "個" }, 2), "0.5個");
});

test("小さすぎる量は 0 にしない", () => {
  assert.equal(scaleAmount(0.1, "個", 1), 0.5);
  assert.equal(scaleAmount(0.2, "g", 1), 1);
});

test("数値なし（少々・適量）は人数で変えない", () => {
  assert.equal(scaleText({ amount: null, unit: "少々" }, 4), "少々");
  assert.equal(scaleAmount(undefined, "適量", 2), null);
  assert.equal(scaleAmount("abc", "g", 2), null);
});

test("人数は1〜6に収める", () => {
  assert.equal(clampServings(0), 1);
  assert.equal(clampServings(10), 6);
  assert.equal(clampServings("3"), 3);
  assert.equal(clampServings(NaN), 1);
});

test("単位なし", () => {
  assert.equal(amountText(2, ""), "2");
  assert.equal(amountText(null, undefined), "");
});
