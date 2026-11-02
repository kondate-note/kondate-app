// IndexedDB の読み書き。写真・記録などはすべてここを通す
const DB_NAME = "kondate";
const DB_VERSION = 1;

// settings 以外が「利用者のデータ」。書き出し・読み込みの対象
export const STORES = ["recipes", "meals", "photos", "shopping", "settings"];

let dbPromise = null;

export function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("recipes")) db.createObjectStore("recipes", { keyPath: "id" });
        if (!db.objectStoreNames.contains("meals")) {
          const meals = db.createObjectStore("meals", { keyPath: "id" });
          meals.createIndex("date", "date");
          meals.createIndex("dateSlot", ["date", "slot"], { unique: true }); // 同じ日・同じ枠は1件
        }
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos", { keyPath: "id" });
        if (!db.objectStoreNames.contains("shopping")) db.createObjectStore("shopping", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => db.close(); // 別タブで新しい版が開いたら閉じる
        resolve(db);
      };
      req.onerror = () => { dbPromise = null; reject(req.error); };
    });
  }
  return dbPromise;
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function whenDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    // error の時点では tx.error はまだ null のことがあるので、失敗した操作のエラーを使う
    tx.onerror = e => reject(e.target?.error ?? tx.error ?? new Error("保存できませんでした"));
    tx.onabort = () => reject(tx.error ?? new Error("保存を中止しました"));
  });
}

// fn の中では IndexedDB 以外の await をしないこと（トランザクションが閉じてしまう）
export async function transact(storeNames, mode, fn) {
  const db = await openDB();
  const tx = db.transaction(storeNames, mode);
  const done = whenDone(tx);
  let result;
  try {
    result = fn(tx);
  } catch (e) {
    tx.abort();
    await done.catch(() => {});
    throw e;
  }
  await done;
  return result;
}

export async function getAll(store) {
  const db = await openDB();
  return promisify(db.transaction(store).objectStore(store).getAll());
}

export async function get(store, key) {
  const db = await openDB();
  return promisify(db.transaction(store).objectStore(store).get(key));
}

export function put(store, value) {
  return transact([store], "readwrite", tx => { tx.objectStore(store).put(value); });
}

export function del(store, key) {
  return transact([store], "readwrite", tx => { tx.objectStore(store).delete(key); });
}

// 1つのストアの中身をまるごと入れ替える
export function replaceStore(store, rows) {
  return transact([store], "readwrite", tx => {
    const s = tx.objectStore(store);
    s.clear();
    for (const row of rows) s.put(row);
  });
}

// ===== 献立 =====
export async function getMeal(date, slot) {
  const db = await openDB();
  const idx = db.transaction("meals").objectStore("meals").index("dateSlot");
  return promisify(idx.get([date, slot]));
}

// from〜to（どちらも "YYYY-MM-DD"、両端を含む）
export async function getMealsBetween(from, to) {
  const db = await openDB();
  const idx = db.transaction("meals").objectStore("meals").index("date");
  return promisify(idx.getAll(IDBKeyRange.bound(from, to)));
}

// 献立を入れ、上書きで不要になった写真も同じトランザクションで消す
export function saveMeal(meal, removePhotoId = null) {
  return transact(["meals", "photos"], "readwrite", tx => {
    tx.objectStore("meals").put(meal);
    if (removePhotoId) tx.objectStore("photos").delete(removePhotoId);
  });
}

// 1週間分など、まとめて保存
export function saveMeals(meals, removePhotoIds = []) {
  return transact(["meals", "photos"], "readwrite", tx => {
    for (const m of meals) tx.objectStore("meals").put(m);
    for (const id of removePhotoIds) tx.objectStore("photos").delete(id);
  });
}

export function deleteMeal(meal) {
  return transact(["meals", "photos"], "readwrite", tx => {
    tx.objectStore("meals").delete(meal.id);
    if (meal.photoId) tx.objectStore("photos").delete(meal.photoId);
  });
}

// ===== 設定（APIキーは localStorage。ここには入れない） =====
export async function getSetting(key, fallback = null) {
  const row = await get("settings", key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  return put("settings", { key, value });
}

// ===== 書き出し・読み込み用 =====
export async function dumpAll() {
  const out = {};
  for (const s of STORES) out[s] = await getAll(s);
  return out;
}

// 全ストアを1トランザクションで入れ替える。途中で失敗したら元のデータが残る
export function replaceAll(data) {
  return transact(STORES, "readwrite", tx => {
    for (const s of STORES) {
      const store = tx.objectStore(s);
      store.clear();
      for (const row of data[s] ?? []) store.put(row);
    }
  });
}

// ブラウザに「消さないで」とお願いする（許可されるかはブラウザしだい）
export async function requestPersist() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      return await navigator.storage.persist();
    }
    return true;
  } catch {
    return false;
  }
}

export async function storageEstimate() {
  try {
    return (await navigator.storage?.estimate?.()) ?? null;
  } catch {
    return null;
  }
}

export function isQuotaError(e) {
  return e?.name === "QuotaExceededError";
}
