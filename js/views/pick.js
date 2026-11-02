// 献立を決める: ジャンル・ランダム・1週間分
import { h, toast, saveError } from "../ui.js";
import { push, goTab } from "../router.js";
import { GENRES, genreOf } from "../data/genres.js";
import { allRecipes, applyWeekPlan } from "../store.js";
import { mainPool, pickRandom, planWeek, slotLabel } from "../lib/plan.js";
import { parseDateKey, DOW } from "../lib/date.js";
import { recipeRow, recipeView, chooseSlot, recipeMeta } from "./recipe.js";

export function genreView() {
  return async () => {
    const recipes = await allRecipes();
    return ["ジャンルで選ぶ", h("div", { class: "grid3" }, ...GENRES.map(g => {
      const list = recipes.filter(r => r.genre === g.id);
      return h("button", { class: "tile", onclick: () => push(genreListView(g)) },
        h("span", { class: "emoji" }, g.emoji), g.name, h("div", { class: "count" }, `${list.length}品`));
    }))];
  };
}

function genreListView(g) {
  return async () => {
    const list = (await allRecipes()).filter(r => r.genre === g.id);
    return [`${g.emoji} ${g.name}`, list.length
      ? h("div", { class: "list" }, ...list.map(r => recipeRow(r)))
      : h("div", { class: "notice" }, "このジャンルのレシピはまだありません")];
  };
}

export function randomView() {
  let r = null; // もどってきたときに同じ料理を見せる
  return async () => {
    const pool = mainPool(await allRecipes());
    r ??= pickRandom(pool);
    if (!r) return ["ランダム", h("div", { class: "notice" }, "レシピがありません")];
    const box = h("div", {});
    const draw = () => {
      const g = genreOf(r.genre);
      box.replaceChildren(h("div", { class: "card stack" },
        h("div", { class: "meta" }, `${g.emoji} ${g.name}`),
        h("div", {}, h("strong", { class: "recipe-name" }, r.name)),
        h("div", { class: "meta" }, recipeMeta(r)),
        h("button", { class: "btn", onclick: () => push(recipeView(r)) }, "レシピを見る"),
        h("button", { class: "btn primary", onclick: () => chooseSlot(r) }, "🍽 これにする"),
        h("button", { class: "btn", onclick: () => { r = pickRandom(pool, { exclude: new Set([r.id]) }); draw(); } }, "🎲 もう一回")));
    };
    draw();
    return ["ランダム", box];
  };
}

export function weekView() {
  let plan = null;
  return async () => {
    const pool = mainPool(await allRecipes());
    plan ??= planWeek(pool, new Date());
    if (!plan.length) return ["1週間分決める", h("div", { class: "notice" }, "レシピがありません")];
    const box = h("div", {});
    const draw = () => box.replaceChildren(h("div", { class: "stack" },
      pool.length < 14 ? h("div", { class: "notice" }, `レシピが${pool.length}品なので、同じ料理が重なることがあります`) : null,
      h("div", { class: "list" }, ...plan.map((p, i) => {
        const d = parseDateKey(p.date);
        return h("div", { class: "row" },
          h("div", { class: "meta" }, `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]}) ${slotLabel(p.slot)}`),
          h("div", { class: "grow title" }, p.recipe.name),
          h("button", {
            class: "btn small", "aria-label": "この枠を選びなおす",
            onclick: () => { plan[i] = { ...p, recipe: pickRandom(pool, { exclude: new Set(plan.map(x => x.recipe.id)) }) }; draw(); },
          }, "🎲"));
      })),
      h("button", {
        class: "btn primary",
        onclick: async () => {
          try {
            const skipped = await applyWeekPlan(plan);
            goTab("calendar");
            if (skipped) toast(`「作った」記録がある${skipped}枠はそのままにしました`);
          } catch (e) { saveError(e); }
        },
      }, "この1週間で決定")));
    draw();
    return ["1週間分決める", box];
  };
}
