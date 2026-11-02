// 自分のレシピの追加・編集
import { h, saveError } from "../ui.js";
import { replace } from "../router.js";
import { GENRES } from "../data/genres.js";
import { emptyForm, recipeToForm, formToRecipe, LIMITS } from "../lib/recipeForm.js";
import { saveCustomRecipe } from "../store.js";
import { recipeView } from "./recipe.js";

// recipe を渡すと編集、なければ追加。initialForm はAIの案などを最初から入れておくとき
export function editView(recipe = null, initialForm = null) {
  // 入力中の内容は form に持つ（画面を描きなおしても消えない）
  const form = initialForm ?? (recipe ? recipeToForm(recipe) : emptyForm());
  let errors = [];

  return () => {
    const errorBox = h("div", {});
    const showErrors = () => errorBox.replaceChildren(errors.length
      ? h("div", { class: "notice warn", role: "alert" }, h("strong", {}, "保存できません"),
        h("ul", { class: "errors" }, ...errors.map(e => h("li", {}, e))))
      : "");

    const text = (key, attrs) => h("input", {
      type: "text", value: form[key], ...attrs,
      oninput: e => { form[key] = e.target.value; },
    });

    const genreChips = h("div", { class: "chips wrap", role: "radiogroup", "aria-label": "ジャンル" });
    const drawGenres = () => genreChips.replaceChildren(...GENRES.map(g => h("button", {
      class: form.genre === g.id ? "chip on" : "chip", role: "radio", "aria-checked": String(form.genre === g.id),
      onclick: () => { form.genre = g.id; drawGenres(); },
    }, `${g.emoji}${g.name}`)));
    drawGenres();

    const ingBox = h("div", { class: "stack" });
    const drawIngredients = () => ingBox.replaceChildren(...form.ingredients.map((row, i) =>
      h("div", { class: "ingrow" },
        h("input", {
          type: "text", value: row.name, placeholder: "材料名", "aria-label": `材料${i + 1}の名前`, maxlength: LIMITS.ingredientName,
          oninput: e => { row.name = e.target.value; },
        }),
        h("input", {
          type: "text", value: row.amount, placeholder: "例：100g", "aria-label": `材料${i + 1}の分量`, maxlength: LIMITS.amount,
          oninput: e => { row.amount = e.target.value; },
        }),
        h("button", {
          class: "icon-btn", "aria-label": `材料${i + 1}を消す`,
          onclick: () => { form.ingredients.splice(i, 1); if (!form.ingredients.length) form.ingredients.push({ name: "", amount: "" }); drawIngredients(); },
        }, "✕"))));
    drawIngredients();

    const steps = h("textarea", { placeholder: "1行に1手順ずつ書いてください", "aria-label": "作り方", rows: 6 });
    steps.value = form.steps;
    steps.addEventListener("input", () => { form.steps = steps.value; });

    const save = async () => {
      const res = formToRecipe(form, recipe?.id);
      errors = res.errors;
      showErrors();
      if (errors.length) { errorBox.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      try {
        await saveCustomRecipe(res.recipe);
        // 編集のときは古いレシピ画面も閉じて、新しい内容で開きなおす
        await replace(recipeView(res.recipe), recipe ? 2 : 1);
      } catch (e) { saveError(e); }
    };

    showErrors();
    return [recipe ? "レシピを編集" : "自分のレシピを追加", h("div", { class: "stack" },
      text("name", { placeholder: "料理名", "aria-label": "料理名", maxlength: LIMITS.name }),
      genreChips,
      text("minutes", { placeholder: "調理時間（分）", "aria-label": "調理時間（分）", inputmode: "numeric" }),
      h("h2", {}, "材料（1人分）"),
      h("div", { class: "meta" }, "分量は「100g」「大さじ1」「1/2個」「少々」のように書くと、人数に合わせて計算します"),
      ingBox,
      h("button", {
        class: "btn small",
        onclick: () => { if (form.ingredients.length < LIMITS.ingredients) { form.ingredients.push({ name: "", amount: "" }); drawIngredients(); } },
      }, "＋材料を追加"),
      h("h2", {}, "作り方"),
      steps,
      errorBox,
      h("button", { class: "btn primary", onclick: save }, "保存する"))];
  };
}
