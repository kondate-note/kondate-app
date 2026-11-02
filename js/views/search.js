import { h } from "../ui.js";
import { push, render } from "../router.js";
import { GENRES } from "../data/genres.js";
import { allRecipes } from "../store.js";
import { recipeRow } from "./recipe.js";
import { editView } from "./edit.js";

const state = { q: "", genre: null };

export async function searchView() {
  const recipes = await allRecipes();
  const results = h("div", { class: "stack" });
  const draw = () => {
    const q = state.q.trim();
    const hits = recipes.filter(r =>
      (!state.genre || r.genre === state.genre) &&
      (!q || r.name.includes(q) || r.ingredients.some(i => i.name.includes(q))));
    results.replaceChildren(
      h("div", { class: "meta" }, `${hits.length}件`),
      hits.length ? h("div", { class: "list" }, ...hits.map(r => recipeRow(r))) : h("div", { class: "notice" }, "見つかりませんでした"));
  };
  // 入力中は結果だけ描きなおす（入力欄のフォーカスを保つ）
  const input = h("input", {
    type: "search", placeholder: "料理名・材料名（例：卵、パスタ）", value: state.q, "aria-label": "検索",
    oninput: e => { state.q = e.target.value; draw(); },
  });
  const chip = (id, label) => h("button", {
    class: state.genre === id ? "chip on" : "chip",
    onclick: () => { state.genre = id; render(); },
  }, label);
  draw();
  return ["さがす", h("div", { class: "stack" },
    input,
    h("div", { class: "chips" }, chip(null, "すべて"), ...GENRES.map(g => chip(g.id, `${g.emoji}${g.name}`))),
    results,
    h("button", { class: "btn", onclick: () => push(editView()) }, "✏️ 自分のレシピを追加"))];
}
