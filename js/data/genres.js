export const GENRES = [
  { id: "pasta", name: "パスタ", emoji: "🍝" },
  { id: "don", name: "丼もの", emoji: "🍚" },
  { id: "meat", name: "定食（肉）", emoji: "🍖" },
  { id: "fish", name: "定食（魚）", emoji: "🐟" },
  { id: "noodle", name: "麺類", emoji: "🍜" },
  { id: "western", name: "カレー・洋食", emoji: "🍛" },
  { id: "chinese", name: "中華", emoji: "🥟" },
  { id: "soup", name: "汁物・鍋", emoji: "🍲" },
  { id: "side", name: "副菜", emoji: "🥗" },
];

export const TOOLS = { frypan: "フライパン", pot: "鍋", microwave: "レンジ", ricecooker: "炊飯器" };

export const DIFFICULTY = ["", "かんたん", "ふつう", "ちょっと手間"];

export function genreOf(id) {
  return GENRES.find(g => g.id === id) ?? { id, name: "その他", emoji: "🍽" };
}
