// 画面テスト用のサーバー。GitHub Pages と同じように /kondate-app/ の下（サブパス）で配信する
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const port = Number(process.argv[2] ?? 8181);
const BASE = "/kondate-app/";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml",
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!path.startsWith(BASE)) { res.writeHead(404).end(); return; }
  let rel = path.slice(BASE.length) || "index.html";
  if (rel.endsWith("/")) rel += "index.html";
  const file = normalize(join(root, rel));
  // リポジトリの外や、公開しないフォルダは出さない
  if (!file.startsWith(root) || /^(node_modules|tests|\.git)[\\/]/.test(rel)) { res.writeHead(404).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, "127.0.0.1");
