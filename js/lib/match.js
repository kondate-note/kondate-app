// 残り材料とレシピの照合。表記ゆれは簡単な読み替え表で吸収する

// 先に書いたものから順に調べる（「玉ねぎ」を「ねぎ」より先に）
const ALIASES = [
  ["たまねぎ", ["玉ねぎ", "たまねぎ", "玉葱", "新玉ねぎ"]],
  ["ねぎ", ["長ねぎ", "青ねぎ", "万能ねぎ", "小ねぎ", "白ねぎ", "ねぎ", "葱"]],
  ["豚肉", ["豚こま", "豚バラ", "豚ばら", "豚ロース", "豚もも", "豚肩", "豚肉", "ぶた肉", "ぶたにく"]],
  ["ひき肉", ["ひき肉", "挽き肉", "挽肉", "ミンチ"]],
  ["鶏肉", ["鶏もも", "鶏むね", "鶏胸", "鶏ささみ", "ささみ", "鶏肉", "とり肉", "とりにく", "チキン"]],
  ["牛肉", ["牛こま", "牛バラ", "牛ばら", "牛肉", "ぎゅうにく"]],
  ["卵", ["卵", "玉子", "たまご", "鶏卵"]],
  ["鮭", ["鮭", "さけ", "しゃけ", "サーモン"]],
  ["ごはん", ["ごはん", "ご飯", "白飯", "米", "こめ"]],
  ["うどん", ["うどん"]],
  ["キャベツ", ["キャベツ", "きゃべつ"]],
  ["にんじん", ["にんじん", "人参", "ニンジン"]],
  ["じゃがいも", ["じゃがいも", "ジャガイモ", "じゃが芋", "馬鈴薯"]],
  ["豆腐", ["豆腐", "とうふ"]],
  ["ウインナー", ["ウインナー", "ウィンナー", "ソーセージ"]],
  ["ほうれん草", ["ほうれん草", "ほうれんそう"]],
  ["大根", ["大根", "だいこん"]],
  ["ピーマン", ["ピーマン", "ぴーまん"]],
  ["きのこ", ["しめじ", "えのき", "まいたけ", "しいたけ", "椎茸", "エリンギ", "きのこ"]],
];

// 調味料など、照合で数えないもの（自分のレシピには seasoning の印がないため名前でも判定）
const SEASONINGS = ["水", "湯", "塩", "こしょう", "胡椒", "砂糖", "しょうゆ", "醤油", "みりん", "酒", "酢", "油", "みそ", "味噌",
  "バター", "小麦粉", "片栗粉", "めんつゆ", "ケチャップ", "マヨネーズ", "ソース", "だし", "コンソメ", "鶏ガラ", "ルウ", "の素",
  "しょうが", "生姜", "にんにく", "かつお節", "ごま", "ラー油", "豆板醤", "オイスター"];

// カタカナ→ひらがな、全角→半角、空白とかっこ書きを消す
export function normalizeName(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/\s+/g, "")
    .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

const ALIAS_TABLE = ALIASES.map(([canon, words]) => [canon, words.map(normalizeName)]);

export function canonical(name) {
  const n = normalizeName(name);
  for (const [canon, words] of ALIAS_TABLE) {
    if (words.some(w => n.includes(w))) return canon;
  }
  return null;
}

export function sameIngredient(a, b) {
  const ca = canonical(a), cb = canonical(b);
  if (ca && cb) return ca === cb;
  const na = normalizeName(a), nb = normalizeName(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

export function isSeasoning(ing) {
  if (ing.seasoning) return true;
  const n = normalizeName(ing.name);
  return SEASONINGS.some(s => n.includes(normalizeName(s)));
}

export function mainIngredients(recipe) {
  return recipe.ingredients.filter(i => !isSeasoning(i));
}

// 一致率の高い順。1つも一致しないレシピは出さない
export function rankByLeftovers(recipes, have) {
  const items = have.map(s => String(s).trim()).filter(Boolean);
  if (!items.length) return [];
  return recipes.map(recipe => {
    const main = mainIngredients(recipe);
    const hits = main.filter(i => items.some(x => sameIngredient(i.name, x)));
    return {
      recipe,
      hit: hits.length,
      total: main.length,
      rate: main.length ? hits.length / main.length : 0,
      missing: main.filter(i => !hits.includes(i)).map(i => i.name),
    };
  })
    .filter(x => x.hit > 0)
    .sort((a, b) => b.rate - a.rate || b.hit - a.hit || a.recipe.minutes - b.recipe.minutes);
}
