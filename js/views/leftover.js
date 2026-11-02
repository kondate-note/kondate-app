// 残り材料から相談: まず内蔵レシピ（オフラインでも動く）、ボタンでAIにも聞く
import { h, sheet } from "../ui.js";
import { push, goTab } from "../router.js";
import { allRecipes } from "../store.js";
import { rankByLeftovers } from "../lib/match.js";
import { askIdeas, errorText, ideaToForm, usesForbiddenTool } from "../lib/gemini.js";
import { getApiKey, getModel } from "../settings.js";
import { genreOf } from "../data/genres.js";
import { recipeView } from "./recipe.js";
import { editView } from "./edit.js";

// 画面を移っても入れた材料とAIの返事を覚えておく
const state = { have: [], ai: null, aiError: "", waiting: false, aiFor: "" };

export function leftoverView() {
  return async () => {
    const recipes = await allRecipes();
    const input = h("input", { type: "text", placeholder: "残っている材料（例：キャベツ）", "aria-label": "残っている材料", maxlength: 30 });
    const box = h("div", { class: "stack" });

    const drawAi = () => {
      const key = state.have.join("、");
      const stale = state.ai && state.aiFor !== key;
      return h("div", { class: "stack" },
        h("button", { class: "btn primary", disabled: state.waiting || !state.have.length, onclick: ask },
          state.waiting ? "🤖 考え中…" : "🤖 AIにも聞く"),
        h("div", { class: "meta" }, "AIには材料名だけを送ります。個人情報は入れないでください。"),
        state.aiError ? h("div", { class: "notice warn", role: "alert" }, state.aiError) : null,
        state.ai ? h("h2", {}, stale ? "AIの提案（前に入れた材料で）" : "AIの提案") : null,
        ...(state.ai ?? []).map(idea => {
          const g = genreOf(idea.genre);
          return h("div", { class: "card stack" },
            h("div", { class: "meta" }, `${g.emoji} ${g.name}・⏱${idea.minutes}分`),
            h("strong", {}, idea.name),
            idea.point ? h("div", {}, idea.point) : null,
            usesForbiddenTool(idea) ? h("div", { class: "notice warn" }, "⚠ オーブン・トースター・グリルを使う手順があります") : null,
            h("div", { class: "meta" }, "材料：", idea.ingredients.map(i => `${i.name} ${i.amount}`).join("、")),
            h("ol", { class: "steps" }, ...idea.steps.map(s => h("li", {}, s))),
            h("button", { class: "btn small", onclick: () => push(editView(null, ideaToForm(idea))) }, "✏️ 自分のレシピとして保存"));
        }));
    };

    const draw = () => {
      const ranked = rankByLeftovers(recipes, state.have);
      box.replaceChildren(
        state.have.length
          ? h("div", { class: "chips wrap" }, ...state.have.map(x =>
            h("button", { class: "chip on", "aria-label": `${x}を外す`, onclick: () => { state.have = state.have.filter(y => y !== x); draw(); } }, `${x} ✕`)))
          : null,
        h("h2", {}, "内蔵レシピで作れそうなもの"),
        ranked.length
          ? h("div", { class: "list" }, ...ranked.map(x => {
            const bar = h("span", {});
            bar.style.width = `${Math.round(x.rate * 100)}%`; // style 属性ではなく JS で（CSPのため）
            return h("button", { class: "row", onclick: () => push(recipeView(x.recipe)) },
              h("div", { class: "grow" },
                h("div", { class: "title" }, x.recipe.name),
                h("div", { class: "meta" }, `材料 ${x.hit}/${x.total} 一致`, x.missing.length ? `・足りない：${x.missing.join("、")}` : ""),
                h("div", { class: "bar" }, bar)),
              h("span", { class: "chev" }, "›"));
          }))
          : h("div", { class: "notice" }, state.have.length ? "内蔵レシピには見つかりませんでした。AIにも聞いてみてください" : "材料を入れると、作れそうな料理が出ます"),
        drawAi());
    };

    async function ask() {
      const apiKey = getApiKey();
      if (!apiKey) {
        sheet("AIのキーが設定されていません", close => [
          h("div", {}, "設定画面で Gemini のAPIキーを入れると使えます。内蔵レシピの結果はそのまま見られます。"),
          h("button", { class: "btn primary", onclick: () => { close(); goTab("config"); } }, "設定を開く"),
          h("button", { class: "btn", onclick: close }, "とじる"),
        ]);
        return;
      }
      state.waiting = true;
      state.aiError = "";
      draw();
      try {
        state.ai = await askIdeas({ apiKey, model: await getModel(), ingredients: state.have });
        state.aiFor = state.have.join("、");
      } catch (e) {
        state.aiError = errorText(e); // 内蔵レシピの結果は表示したまま
      } finally {
        state.waiting = false;
        draw();
      }
    }

    const add = () => {
      const v = input.value.trim();
      if (v && !state.have.includes(v) && state.have.length < 20) state.have.push(v);
      input.value = "";
      draw();
    };
    input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) add(); });
    draw();
    return ["残り材料で相談", h("div", { class: "stack" },
      h("div", { class: "addrow" }, input, h("button", { class: "btn", onclick: add }, "＋追加")),
      box)];
  };
}
