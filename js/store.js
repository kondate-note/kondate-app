// 画面から使うデータ操作（内蔵レシピ＋自分のレシピ、献立、買い物リスト）
import { RECIPES } from "./data/recipes.js";
import * as db from "./db.js";
import { makeMeal, mergePlan } from "./lib/plan.js";
import { addIngredients, sortItems } from "./lib/shopping.js";
import { compressPhoto } from "./lib/photo.js";
import { buildBackup } from "./lib/backup.js";

// ===== レシピ =====
let recipeCache = null;

export async function allRecipes() {
  if (!recipeCache) recipeCache = [...RECIPES, ...(await db.getAll("recipes"))];
  return recipeCache;
}

export function clearRecipeCache() { recipeCache = null; }

export async function findRecipe(id) {
  return (await allRecipes()).find(r => r.id === id) ?? null;
}

export async function saveCustomRecipe(recipe) {
  await db.put("recipes", recipe);
  clearRecipeCache();
}

// 献立・記録には料理名がコピーしてあるので、レシピを消しても記録は残る
export async function deleteCustomRecipe(id) {
  await db.del("recipes", id);
  clearRecipeCache();
}

// ===== 献立 =====
// 「作った」記録がある枠は変えない → { ok: false }
export async function setMeal(date, slot, recipe, servings = 1) {
  const cur = await db.getMeal(date, slot);
  if (cur?.done) return { ok: false };
  await db.saveMeal(makeMeal(date, slot, recipe, cur, servings), cur?.photoId ?? null);
  return { ok: true };
}

// 戻り値: 「作った」記録があって飛ばした枠の数
export async function applyWeekPlan(plan) {
  if (!plan.length) return 0;
  const existing = await db.getMealsBetween(plan[0].date, plan[plan.length - 1].date);
  const { toSave, removePhotoIds, skipped } = mergePlan(existing, plan);
  await db.saveMeals(toSave, removePhotoIds);
  return skipped;
}

// 「作った！」の記録。file があれば圧縮して写真も保存し、前の写真は消す
export async function recordDone(meal, file = null) {
  // 圧縮はトランザクションの外で（中で待つとトランザクションが閉じる）
  const photo = file ? { id: crypto.randomUUID(), blob: await compressPhoto(file), createdAt: Date.now() } : null;
  await db.transact(["meals", "photos"], "readwrite", tx => {
    const photos = tx.objectStore("photos");
    if (photo) {
      photos.put(photo);
      if (meal.photoId) photos.delete(meal.photoId);
    }
    tx.objectStore("meals").put({ ...meal, done: true, photoId: photo ? photo.id : meal.photoId });
  });
}

// 記録を取り消して予定にもどす（写真も消す）
export function undoDone(meal) {
  return db.saveMeal({ ...meal, done: false, photoId: null }, meal.photoId);
}

// ===== 書き出し・読み込み =====
export async function exportBackup() {
  return buildBackup(await db.dumpAll());
}

// 全データを1トランザクションで入れ替える。失敗したら元のデータが残る
export async function applyBackup(data) {
  await db.replaceAll(data);
  clearRecipeCache();
}

// ===== 買い物リスト =====
export async function shoppingList() {
  return sortItems(await db.getAll("shopping"));
}

export async function addRecipeToShopping(recipe, servings) {
  const { list, added } = addIngredients(await shoppingList(), recipe.ingredients, servings);
  await db.replaceStore("shopping", list);
  return added;
}
