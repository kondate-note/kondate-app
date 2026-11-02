import { h, saveError } from "../ui.js";
import { render } from "../router.js";
import * as db from "../db.js";
import { shoppingList } from "../store.js";
import { newItem, nextSeq, itemAmountText } from "../lib/shopping.js";

export async function shoppingView() {
  const items = await shoppingList();
  const run = async fn => { try { await fn(); } catch (e) { saveError(e); } render(); };

  const input = h("input", { type: "text", placeholder: "追加する（例：牛乳）", "aria-label": "追加する品物" });
  const add = () => {
    const v = input.value.trim();
    if (!v) return;
    run(() => db.put("shopping", newItem(v, null, "", nextSeq(items))));
  };
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) add(); });
  const checked = items.filter(it => it.checked);

  return ["買い物リスト", h("div", { class: "stack" },
    h("div", { class: "addrow" }, input, h("button", { class: "btn", onclick: add }, "＋追加")),
    items.length
      ? h("div", { class: "list" }, ...items.map(it =>
        h("div", { class: it.checked ? "check done" : "check" },
          h("input", {
            type: "checkbox", checked: it.checked, "aria-label": it.name,
            onchange: () => run(() => db.put("shopping", { ...it, checked: !it.checked })),
          }),
          h("span", { class: "title grow" }, it.name),
          h("span", { class: "meta" }, itemAmountText(it)),
          h("button", { class: "icon-btn", "aria-label": `${it.name}を消す`, onclick: () => run(() => db.del("shopping", it.id)) }, "✕"))))
      : h("div", { class: "notice" }, "リストは空です。レシピ画面の「買い物リストへ」で追加できます"),
    checked.length
      ? h("button", {
        class: "btn",
        onclick: () => run(() => db.transact(["shopping"], "readwrite", tx => {
          for (const it of checked) tx.objectStore("shopping").delete(it.id);
        })),
      }, `✔ チェック済み（${checked.length}）を消す`)
      : null)];
}
