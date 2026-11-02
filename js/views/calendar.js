import { h, toast, objectUrl, sheet, confirmSheet, saveError } from "../ui.js";
import { push, render } from "../router.js";
import * as db from "../db.js";
import { findRecipe, recordDone, undoDone } from "../store.js";
import { dateKey, parseDateKey, addDays, dateLabel, DOW } from "../lib/date.js";
import { SLOTS, slotLabel } from "../lib/plan.js";
import { recipeView } from "./recipe.js";

// タブを切り替えても見ていた月・日を覚えておく
const state = { month: null, sel: null };

async function photoUrl(photoId) {
  const p = photoId && await db.get("photos", photoId);
  return p?.blob ? objectUrl(p.blob) : null;
}

export async function calendarView() {
  const now = new Date();
  const todayKey = dateKey(now);
  state.month ??= new Date(now.getFullYear(), now.getMonth(), 1);
  state.sel ??= todayKey;
  const m = state.month;

  const first = new Date(m.getFullYear(), m.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const end = addDays(start, 41);
  const meals = await db.getMealsBetween(dateKey(start), dateKey(end));
  const byDate = new Map();
  for (const x of meals) {
    if (!byDate.has(x.date)) byDate.set(x.date, {});
    byDate.get(x.date)[x.slot] = x;
  }

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    const k = dateKey(d);
    const day = byDate.get(k) ?? {};
    const ms = SLOTS.map(s => day[s]).filter(Boolean);
    const photoId = ms.find(x => x.photoId)?.photoId;
    const url = await photoUrl(photoId);
    const cls = ["day", d.getMonth() !== m.getMonth() && "other", k === todayKey && "today", k === state.sel && "sel"]
      .filter(Boolean).join(" ");
    cells.push(h("button", { class: cls, "aria-label": dateLabel(d), onclick: () => { state.sel = k; render(); } },
      h("span", {}, d.getDate()),
      url ? h("img", { src: url, alt: "" })
        : h("div", { class: "dots" }, ...ms.map(x => h("span", { class: x.done ? "dot done" : "dot" })))));
  }

  const sel = state.sel;
  const selMeals = await db.getMealsBetween(sel, sel);
  const detail = [];
  for (const slot of SLOTS) {
    const ml = selMeals.find(x => x.slot === slot);
    const r = ml && await findRecipe(ml.recipeId);
    const url = ml && await photoUrl(ml.photoId);
    detail.push(h("div", { class: "card stack" },
      h("div", { class: "meal" },
        h("span", { class: "slot" }, slotLabel(slot)),
        ml ? h("span", { class: "name" }, ml.recipeName) : h("span", { class: "empty" }, "なし"),
        ml?.done ? h("span", { class: "meta" }, "✅作った") : null),
      url ? h("img", { class: "photo", src: url, alt: `${ml.recipeName}の写真` }) : null,
      ml ? h("div", { class: "grid2" },
        h("button", {
          class: "btn small",
          onclick: () => r ? push(recipeView(r, ml.servings)) : toast("このレシピは削除されています"),
        }, "レシピを見る"),
        h("button", { class: "btn small primary", onclick: () => doneSheet(ml) },
          ml.done ? (ml.photoId ? "📷 写真を変える" : "📷 写真を追加") : "📷 作った！")) : null));
  }

  // 写真の入力は1つを使い回す（iPhone では画面に置いてある input でないと開かないことがある）
  fileInput.value = "";

  const move = n => { state.month = new Date(m.getFullYear(), m.getMonth() + n, 1); render(); };
  return ["カレンダー", h("div", {},
    h("div", { class: "cal-head" },
      h("button", { "aria-label": "前の月", onclick: () => move(-1) }, "‹"),
      h("strong", {}, `${m.getFullYear()}年${m.getMonth() + 1}月`),
      h("button", { "aria-label": "次の月", onclick: () => move(1) }, "›")),
    h("div", { class: "cal" }, ...DOW.map(x => h("div", { class: "dow" }, x)), ...cells),
    h("h2", {}, dateLabel(parseDateKey(sel))),
    h("div", { class: "stack" }, ...detail),
    fileInput)];
}

// capture を付けない＝撮影もアルバムから選ぶのもできる
const fileInput = h("input", { type: "file", accept: "image/*", class: "hidden", "aria-label": "写真" });
let fileTarget = null;
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  const meal = fileTarget;
  fileTarget = null;
  if (!file || !meal) return;
  await save(meal, file);
});

function pickPhoto(meal) {
  fileTarget = meal;
  fileInput.click();
}

async function save(meal, file) {
  try {
    await recordDone(meal, file);
  } catch (e) {
    if (e?.message === "NOT_IMAGE") toast("この写真は読み込めませんでした。別の写真をえらんでください");
    else saveError(e);
  }
  render();
}

function doneSheet(meal) {
  if (!meal.done) {
    sheet(`「${meal.recipeName}」を作った！`, close => [
      h("button", { class: "btn primary", onclick: () => { close(); pickPhoto(meal); } }, "📷 写真を撮る・えらぶ"),
      h("button", { class: "btn", onclick: () => { close(); save(meal, null); } }, "写真なしで記録"),
      h("button", { class: "btn", onclick: close }, "やめる"),
    ]);
  } else {
    sheet(meal.recipeName, close => [
      h("button", { class: "btn primary", onclick: () => { close(); pickPhoto(meal); } },
        meal.photoId ? "📷 写真をえらびなおす" : "📷 写真を追加"),
      h("button", {
        class: "btn",
        onclick: async () => {
          close();
          if (!(await confirmSheet("「作った」記録を取り消しますか？（写真も消えます）", "取り消す"))) return;
          try { await undoDone(meal); } catch (e) { saveError(e); }
          render();
        },
      }, "記録を取り消す"),
      h("button", { class: "btn", onclick: close }, "やめる"),
    ]);
  }
}
