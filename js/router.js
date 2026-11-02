// 画面切り替え。タブは URL の # で、タブの中のサブ画面は stack で持つ
import { h, revokeUrls } from "./ui.js";

export const TABS = [
  { id: "today", name: "きょう", i: "🏠" },
  { id: "calendar", name: "カレンダー", i: "📅" },
  { id: "search", name: "さがす", i: "🔍" },
  { id: "shopping", name: "買い物", i: "🛒" },
  { id: "config", name: "設定", i: "⚙️" },
];

let views = {};
let stack = []; // サブ画面。各要素は [title, body] を返す関数
let seq = 0;    // 古い描画が後から終わったときに上書きしないための番号

export function setViews(v) { views = v; }

export function currentTab() {
  const t = location.hash.slice(1);
  return TABS.some(x => x.id === t) ? t : "today";
}

export async function render() {
  const my = ++seq;
  const top = stack[stack.length - 1];
  const tab = currentTab();
  revokeUrls();
  let title, body;
  try {
    [title, body] = await (top ?? views[tab])();
  } catch (e) {
    console.error(e);
    title = "エラー";
    body = h("div", { class: "notice warn" }, "表示できませんでした。アプリを開きなおしてください");
  }
  if (my !== seq) return;
  document.getElementById("tabs").replaceChildren(...TABS.map(t =>
    h("a", {
      href: "#" + t.id,
      class: t.id === tab ? "on" : null,
      onclick: e => { if (t.id === currentTab()) { e.preventDefault(); goTab(t.id); } },
    }, h("span", { class: "i" }, t.i), t.name)));
  document.getElementById("title").textContent = title;
  document.getElementById("back").classList.toggle("hidden", !top);
  document.getElementById("view").replaceChildren(body);
}

export async function push(view) {
  stack.push(view);
  await render();
  window.scrollTo(0, 0);
}

// 上から depth 個のサブ画面を閉じて view を開く（保存後に編集画面をレシピ画面に置きかえるなど）
export async function replace(view, depth = 1) {
  stack.splice(Math.max(0, stack.length - depth));
  return push(view);
}

export function pop() {
  stack.pop();
  return render();
}

export function goTab(id) {
  stack = [];
  if (location.hash === "#" + id) render();
  else location.hash = "#" + id; // hashchange で render される
  window.scrollTo(0, 0);
}

export function start() {
  document.getElementById("back").addEventListener("click", pop);
  window.addEventListener("hashchange", () => { stack = []; render(); window.scrollTo(0, 0); });
  return render();
}
