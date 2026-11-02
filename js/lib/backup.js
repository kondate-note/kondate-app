// 書き出しファイルの作成と読み取り。画面や保存には触らない
//
// ファイルの形（写真をJSONに埋め込まず、後ろにそのままつなげる＝写真が多くても重くならない）
//   [目印 "KONDATE-BACKUP\n"][ヘッダの長さ 4バイト][ヘッダJSON（UTF-8）][写真1][写真2]…
// ヘッダJSONの photos に、各写真の id・種類・バイト数を順番に書く
import { parseDateKey } from "./date.js";
import { SLOTS } from "./plan.js";

export const MAGIC = "KONDATE-BACKUP\n";
export const FORMAT_VERSION = 1;
const DATA_STORES = ["recipes", "meals", "shopping", "settings"];
const MAX_HEADER = 50 * 1024 * 1024;

export class BackupError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export const BACKUP_ERROR_TEXT = {
  NOT_BACKUP: "こんだてノートの書き出しファイルではありません",
  NEWER_VERSION: "新しい版のアプリで書き出されたファイルです。アプリを更新してから読み込んでください",
  BROKEN: "ファイルが壊れているか、途中までしかありません",
};

// APIキーらしき設定は書き出さない・読み込まない
const isSecretSetting = row => /api.?key|token|secret/i.test(String(row?.key ?? ""));

export function backupFileName(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `kondate-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.kondate`;
}

// data: { recipes, meals, photos:[{id, blob, createdAt}], shopping, settings }
export function buildBackup(data, now = new Date()) {
  const photos = data.photos ?? [];
  const header = {
    app: "kondate",
    version: FORMAT_VERSION,
    exportedAt: now.toISOString(), // 記録用の時刻なのでUTCでよい（日付キーには使わない）
    recipes: data.recipes ?? [],
    meals: data.meals ?? [],
    shopping: data.shopping ?? [],
    settings: (data.settings ?? []).filter(r => !isSecretSetting(r)),
    photos: photos.map(p => ({ id: p.id, type: p.blob.type || "image/jpeg", size: p.blob.size, createdAt: p.createdAt ?? null })),
  };
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, headerBytes.length);
  return new Blob([MAGIC, len, headerBytes, ...photos.map(p => p.blob)], { type: "application/octet-stream" });
}

export function summarize(data) {
  return {
    recipes: data.recipes?.length ?? 0,
    meals: data.meals?.length ?? 0,
    done: data.meals?.filter(m => m.done).length ?? 0,
    photos: data.photos?.length ?? 0,
    shopping: data.shopping?.length ?? 0,
  };
}

// file（Blob）を読み取り、replaceAll に渡せる形にする。おかしければ BackupError
export async function parseBackup(file) {
  const magicLen = new TextEncoder().encode(MAGIC).length;
  if (!file || file.size < magicLen + 4) throw new BackupError("NOT_BACKUP");
  const head = new Uint8Array(await file.slice(0, magicLen + 4).arrayBuffer());
  if (new TextDecoder().decode(head.slice(0, magicLen)) !== MAGIC) throw new BackupError("NOT_BACKUP");
  const headerLen = new DataView(head.buffer).getUint32(magicLen);
  const start = magicLen + 4;
  if (headerLen > MAX_HEADER || start + headerLen > file.size) throw new BackupError("BROKEN");

  let header;
  try {
    header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await file.slice(start, start + headerLen).arrayBuffer()));
  } catch {
    throw new BackupError("BROKEN");
  }
  if (header?.app !== "kondate") throw new BackupError("NOT_BACKUP");
  if (!Number.isInteger(header.version)) throw new BackupError("BROKEN");
  if (header.version > FORMAT_VERSION) throw new BackupError("NEWER_VERSION");
  validateHeader(header);

  // 写真の合計バイト数がファイルの残りとぴったり合うか（途中で切れたファイルを見つける）
  let offset = start + headerLen;
  const total = header.photos.reduce((s, p) => s + p.size, 0);
  if (offset + total !== file.size) throw new BackupError("BROKEN");

  const photos = [];
  for (const p of header.photos) {
    // 元ファイルから切り離して持つ（読み込み後にファイルが消えても困らないように）
    const bytes = await file.slice(offset, offset + p.size).arrayBuffer();
    photos.push({ id: p.id, blob: new Blob([bytes], { type: p.type }), createdAt: p.createdAt });
    offset += p.size;
  }

  const photoIds = new Set(photos.map(p => p.id));
  return {
    recipes: header.recipes.map(r => ({ ...r, custom: true })),
    meals: header.meals.map(m => (m.photoId && !photoIds.has(m.photoId) ? { ...m, photoId: null } : m)),
    photos,
    shopping: header.shopping,
    settings: header.settings.filter(r => !isSecretSetting(r)),
  };
}

const isId = v => typeof v === "string" && v.length > 0 && v.length <= 100;

function validateHeader(h) {
  const fail = () => { throw new BackupError("BROKEN"); };
  for (const s of [...DATA_STORES, "photos"]) if (!Array.isArray(h[s])) fail();

  for (const r of h.recipes) {
    if (!isId(r?.id) || typeof r.name !== "string" || !Array.isArray(r.ingredients) || !Array.isArray(r.steps)) fail();
  }
  const slots = new Set();
  for (const m of h.meals) {
    if (!isId(m?.id) || !parseDateKey(m.date) || !SLOTS.includes(m.slot) || typeof m.recipeName !== "string") fail();
    const k = `${m.date}|${m.slot}`;
    if (slots.has(k)) fail(); // 同じ日・同じ枠は1件
    slots.add(k);
  }
  for (const it of h.shopping) if (!isId(it?.id) || typeof it.name !== "string") fail();
  for (const s of h.settings) if (typeof s?.key !== "string") fail();

  const ids = new Set();
  for (const p of h.photos) {
    if (!isId(p?.id) || ids.has(p.id) || !Number.isSafeInteger(p.size) || p.size < 0 || typeof p.type !== "string") fail();
    ids.add(p.id);
  }
}
