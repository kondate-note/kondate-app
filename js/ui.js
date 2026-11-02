// 画面の部品。innerHTML は使わず要素を組み立てる（XSS対策）
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "style") throw new Error("style 属性は使わない（CSPのため）。class か el.style を使う");
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  if (tag === "button" && !el.hasAttribute("type")) el.type = "button";
  for (const c of kids.flat()) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

// 写真の表示用URL。画面を切り替えるたびに router が片づける
let urls = [];
export function objectUrl(blob) {
  const u = URL.createObjectURL(blob);
  urls.push(u);
  return u;
}
export function revokeUrls() {
  urls.forEach(u => URL.revokeObjectURL(u));
  urls = [];
}

// 下から出るシート。build(close) は中身の要素の配列を返す
export function sheet(title, build) {
  const m = document.getElementById("modal");
  const close = () => m.replaceChildren();
  m.replaceChildren(h("div", { class: "overlay", onclick: e => { if (e.target === e.currentTarget) close(); } },
    h("div", { class: "sheet stack", role: "dialog", "aria-modal": "true" }, h("h3", {}, title), ...build(close))));
  return close;
}

export function toast(msg) {
  sheet(msg, close => [h("button", { class: "btn primary", onclick: close }, "OK")]);
}

export function confirmSheet(msg, okLabel = "OK") {
  return new Promise(resolve => {
    sheet(msg, close => [
      h("button", { class: "btn primary", onclick: () => { close(); resolve(true); } }, okLabel),
      h("button", { class: "btn", onclick: () => { close(); resolve(false); } }, "やめる"),
    ]);
  });
}

// 保存の失敗をわかる言葉で出す
export function saveError(e) {
  console.error(e);
  if (e?.name === "QuotaExceededError") {
    toast("保存する場所がいっぱいです。設定から書き出してから、古い写真を減らしてください");
  } else {
    toast("保存できませんでした。もう一度ためしてください");
  }
}
