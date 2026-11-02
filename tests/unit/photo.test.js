import { test } from "node:test";
import assert from "node:assert/strict";
import { fitSize } from "../../js/lib/photo.js";

test("横長・縦長とも長辺を1024に", () => {
  assert.deepEqual(fitSize(4032, 3024), { width: 1024, height: 768 });
  assert.deepEqual(fitSize(3024, 4032), { width: 768, height: 1024 });
});

test("小さい写真は拡大しない", () => {
  assert.deepEqual(fitSize(640, 480), { width: 640, height: 480 });
});

test("極端に細長くても0pxにならない", () => {
  assert.deepEqual(fitSize(10000, 1), { width: 1024, height: 1 });
});
