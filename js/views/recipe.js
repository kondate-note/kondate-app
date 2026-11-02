// レシピ詳細、一覧の行、「いつ作る？」シート
import { h, sheet, toast, saveError, confirmSheet } from "../ui.js";
import { push, pop, goTab } from "../router.js";
import { genreOf, TOOLS, DIFFICULTY } from "../data/genres.js";
import { scaleText, clampServings, MIN_SERVINGS, MAX_SERVINGS } from "../lib/scale.js";
import { dateKey, addDays } from "../lib/date.js";
import { setMeal, addRecipeToShopping, deleteCustomRecipe } from "../store.js";
import { editView } from "./edit.js";

export function recipeMeta(r) {
  const diff = DIFFICULTY[r.difficulty];
  return `⏱${r.minutes}分${diff ? `・${diff}` : ""}`;
}

export function recipeRow(r, extra = r.custom ? "自分のレシピ" : null) {
  return h("button", { class: "row", onclick: () => push(recipeView(r)) },
    h("span", { class: "emoji" }, genreOf(r.genre).emoji),
    h("div", { class: "grow" },
      h("div", { class: "title" }, r.name),
      h("div", { class: "meta" }, recipeMeta(r), extra ? `・${extra}` : "")),
    h("span", { class: "chev" }, "›"));
}

export function chooseSlot(recipe, servings = 1) {
  const today = new Date();
  const choose = async (day, slot, close) => {
    try {
      const res = await setMeal(dateKey(addDays(today, day)), slot, recipe, servings);
      if (!res.ok) { toast("この枠はもう「作った」記録があるので変更できません"); return; }
      close();
      if (day === 0) goTab("today");
      else toast(`あしたの${slot === "lunch" ? "昼" : "夜"}に入れました`);
    } catch (e) { saveError(e); }
  };
  sheet(`「${recipe.name}」をいつ作る？`, close => [
    h("div", { class: "grid2" },
      h("button", { class: "btn primary", onclick: () => choose(0, "lunch", close) }, "きょうの昼"),
      h("button", { class: "btn primary", onclick: () => choose(0, "dinner", close) }, "きょうの夜"),
      h("button", { class: "btn", onclick: () => choose(1, "lunch", close) }, "あしたの昼"),
      h("button", { class: "btn", onclick: () => choose(1, "dinner", close) }, "あしたの夜")),
    h("button", { class: "btn", onclick: close }, "やめる"),
  ]);
}

export function recipeView(r, startServings = 1) {
  let s = clampServings(startServings);
  return () => {
    const g = genreOf(r.genre);
    const amtCells = [];
    const val = h("div", { class: "val" });
    const update = () => {
      val.textContent = `${s}人分`;
      r.ingredients.forEach((ing, i) => { amtCells[i].textContent = scaleText(ing, s); });
    };
    const body = h("div", {},
      h("div", { class: "meta" }, `${g.emoji} ${g.name}${r.custom ? "（自分のレシピ）" : ""}`),
      h("div", { class: "meta" }, `⏱ ${r.minutes}分　${DIFFICULTY[r.difficulty] ?? ""}　`,
        ...(r.tools ?? []).map(t => h("span", { class: "badge" }, TOOLS[t] ?? t))),
      h("h2", {}, "材料"),
      h("div", { class: "stepper" },
        h("button", { "aria-label": "減らす", onclick: () => { if (s > MIN_SERVINGS) { s--; update(); } } }, "−"),
        val,
        h("button", { "aria-label": "増やす", onclick: () => { if (s < MAX_SERVINGS) { s++; update(); } } }, "＋")),
      h("table", { class: "ing" }, h("tbody", {}, ...r.ingredients.map(ing => {
        const td = h("td", { class: "amt" });
        amtCells.push(td);
        return h("tr", {}, h("td", {}, ing.name), td);
      }))),
      h("h2", {}, "作り方"),
      h("ol", { class: "steps" }, ...r.steps.map(t => h("li", {}, t))),
      h("div", { class: "stack" },
        h("button", { class: "btn primary", onclick: () => chooseSlot(r, s) }, "🍽 この料理に決める"),
        h("button", {
          class: "btn",
          onclick: async () => {
            try { toast(`${await addRecipeToShopping(r, s)}品を買い物リストに入れました`); }
            catch (e) { saveError(e); }
          },
        }, "🛒 材料を買い物リストへ")),
      r.custom ? h("div", { class: "grid2 spaced" },
        h("button", { class: "btn small", onclick: () => push(editView(r)) }, "✏️ 編集"),
        h("button", {
          class: "btn small",
          onclick: async () => {
            if (!(await confirmSheet(`「${r.name}」を削除しますか？（カレンダーの記録は残ります）`, "削除する"))) return;
            try { await deleteCustomRecipe(r.id); pop(); } catch (e) { saveError(e); }
          },
        }, "🗑 削除")) : null);
    update();
    return [r.name, body];
  };
}
