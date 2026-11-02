// 設定。AIキーだけは localStorage（書き出しファイルに入れないため）、ほかは IndexedDB
import { getSetting, setSetting } from "./db.js";
import { DEFAULT_MODEL } from "./lib/gemini.js";

const KEY_NAME = "kondate.geminiApiKey";

export function getApiKey() {
  try { return localStorage.getItem(KEY_NAME) ?? ""; } catch { return ""; }
}

export function setApiKey(value) {
  localStorage.setItem(KEY_NAME, value.trim());
}

export function clearApiKey() {
  try { localStorage.removeItem(KEY_NAME); } catch { /* 何もしない */ }
}

export async function getModel() {
  return (await getSetting("geminiModel")) || DEFAULT_MODEL;
}

export function setModel(model) {
  return setSetting("geminiModel", model.trim());
}
