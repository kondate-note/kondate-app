// sw.js のファイル一覧が、実際のファイルと一致しているか（追加し忘れるとオフラインで動かない）
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const sw = readFileSync(join(root, "sw.js"), "utf8");
const assetsBlock = /const ASSETS = \[([\s\S]*?)\];/.exec(sw)[1];
const listed = [...assetsBlock.matchAll(/"(\.\/[^"]*)"/g)].map(m => m[1]).filter(u => u !== "./");

function walk(dir) {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : [relative(root, join(root, dir, e.name)).replaceAll("\\", "/")]);
}

test("アプリのファイルがすべてキャッシュ一覧に入っている", () => {
  const files = ["index.html", "manifest.json", ...walk("css"), ...walk("js"), ...walk("icons")].map(f => `./${f}`).sort();
  assert.deepEqual([...listed].sort(), files);
});

test("キャッシュ名は kondate- で始まる", () => {
  assert.match(sw, /const VERSION = "kondate-v\d+";/);
});

test("manifest は相対パス", () => {
  const m = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
  assert.equal(m.start_url, "./");
  assert.equal(m.scope, "./");
  for (const i of m.icons) assert.ok(!i.src.startsWith("/"));
});

test("index.html の読み込みはすべて相対パスで、inline script/style がない", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(url.startsWith("./"), url);
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), "inline script");
  assert.ok(!/<style|style="/.test(html), "inline style");
});
