// 日本時間で確認する（0〜9時はUTCだと前の日になる）
process.env.TZ = "Asia/Tokyo";

import { test } from "node:test";
import assert from "node:assert/strict";
import { dateKey, parseDateKey, addDays, dateLabel } from "../../js/lib/date.js";

test("日本時間の早朝でもその日の日付になる", () => {
  assert.equal(dateKey(new Date(2026, 10, 3, 0, 30)), "2026-11-03");
  assert.equal(dateKey(new Date(2026, 10, 3, 8, 59)), "2026-11-03");
});

test("月末・年末・うるう年をまたぐ", () => {
  assert.equal(dateKey(addDays(new Date(2026, 0, 31), 1)), "2026-02-01");
  assert.equal(dateKey(addDays(new Date(2026, 11, 31), 1)), "2027-01-01");
  assert.equal(dateKey(addDays(new Date(2028, 1, 28), 1)), "2028-02-29");
  assert.equal(dateKey(addDays(new Date(2027, 0, 1), -1)), "2026-12-31");
});

test("parseDateKey は正しい形だけ受け付ける", () => {
  assert.equal(dateKey(parseDateKey("2026-11-03")), "2026-11-03");
  assert.equal(parseDateKey("2026-02-30"), null);
  assert.equal(parseDateKey("2026/11/03"), null);
  assert.equal(parseDateKey(undefined), null);
});

test("日付の表示", () => {
  assert.equal(dateLabel(new Date(2026, 10, 2)), "11月2日（月）");
});
