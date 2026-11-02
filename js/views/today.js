import { h, toast } from "../ui.js";
import { push } from "../router.js";
import { getMeal } from "../db.js";
import { findRecipe } from "../store.js";
import { dateKey, dateLabel } from "../lib/date.js";
import { slotLabel } from "../lib/plan.js";
import { recipeView } from "./recipe.js";
import { genreView, randomView, weekView } from "./pick.js";
import { leftoverView } from "./leftover.js";

// iPhone/iPad の Safari タブで開いているか（ホーム画面から開くと standalone になる）
function isIOSBrowserTab() {
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  return ios && !standalone;
}

export async function todayView() {
  const now = new Date();
  const key = dateKey(now);
  const meals = { lunch: await getMeal(key, "lunch"), dinner: await getMeal(key, "dinner") };

  const mealRow = async slot => {
    const m = meals[slot];
    const r = m && await findRecipe(m.recipeId);
    const open = () => {
      if (!m) push(genreView());
      else if (r) push(recipeView(r, m.servings));
      else toast("このレシピは削除されています");
    };
    return h("button", { class: "row", onclick: open },
      h("span", { class: "slot" }, slotLabel(slot)),
      m
        ? h("div", { class: "grow" }, h("div", { class: "title" }, m.recipeName),
          h("div", { class: "meta" }, r ? `⏱${r.minutes}分` : "", m.done ? "・✅作った" : ""))
        : h("div", { class: "grow empty" }, "まだ決まっていません"),
      h("span", { class: "chev" }, "›"));
  };

  return [dateLabel(now), h("div", {},
    h("h2", {}, "きょうの献立"),
    h("div", { class: "list" }, await mealRow("lunch"), await mealRow("dinner")),
    h("h2", {}, "献立を決める"),
    h("div", { class: "grid2" },
      h("button", { class: "tile", onclick: () => push(genreView()) }, h("span", { class: "emoji" }, "🍽"), "ジャンルで選ぶ"),
      h("button", { class: "tile", onclick: () => push(randomView()) }, h("span", { class: "emoji" }, "🎲"), "ランダム"),
      h("button", { class: "tile", onclick: () => push(weekView()) }, h("span", { class: "emoji" }, "📆"), "1週間分決める"),
      h("button", { class: "tile", onclick: () => push(leftoverView()) }, h("span", { class: "emoji" }, "🥕"), "残り材料で相談")),
    isIOSBrowserTab()
      ? h("div", { class: "notice warn" }, "📱 iPhoneは「ホーム画面に追加」してから使ってね（Safariのままだとデータが消えることがあります）")
      : null,
  )];
}
