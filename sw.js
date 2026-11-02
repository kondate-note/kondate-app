// Service Worker: 一度開けばオフラインでも動くようにする（AI相談以外）
// ファイルを変えたら VERSION を上げる（上げないと利用者のスマホが古いままになる）
const VERSION = "kondate-v2";

// アプリのファイル一覧（tests/unit/sw.test.js で、実際のファイルと一致しているか確かめる）
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./js/app.js",
  "./js/db.js",
  "./js/router.js",
  "./js/settings.js",
  "./js/store.js",
  "./js/ui.js",
  "./js/data/genres.js",
  "./js/data/recipes.js",
  "./js/lib/backup.js",
  "./js/lib/date.js",
  "./js/lib/gemini.js",
  "./js/lib/match.js",
  "./js/lib/photo.js",
  "./js/lib/plan.js",
  "./js/lib/recipeForm.js",
  "./js/lib/scale.js",
  "./js/lib/shopping.js",
  "./js/views/calendar.js",
  "./js/views/config.js",
  "./js/views/edit.js",
  "./js/views/leftover.js",
  "./js/views/pick.js",
  "./js/views/recipe.js",
  "./js/views/search.js",
  "./js/views/shopping.js",
  "./js/views/today.js",
];

// 開発中（localhost）は毎回通信して最新を使い、通信できないときだけキャッシュ
const DEV = ["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname);

self.addEventListener("install", event => {
  // cache: "reload" で、ブラウザのキャッシュではなくサーバーから取る
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))));
});

self.addEventListener("activate", event => {
  // 自分（kondate-）の古い版だけ消す。同じサイトのほかのアプリのキャッシュには触らない
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("kondate-") && key !== VERSION) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

// 画面の「再読み込み」ボタンから
self.addEventListener("message", event => {
  if (event.data === "skipWaiting") self.skipWaiting();
});

async function networkFirst(request, fallbackUrl) {
  try {
    const res = await fetch(request);
    if (res.ok) (await caches.open(VERSION)).put(fallbackUrl ?? request, res.clone());
    return res;
  } catch (e) {
    const cached = await caches.match(fallbackUrl ?? request);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached ?? fetch(request);
}

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  // 自分のサイト以外（Gemini など）と GET 以外には触らない＝素通し
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL("./", self.location).pathname)) return;

  if (req.mode === "navigate") {
    // index.html は通信優先（更新に気づけるように）。オフラインならキャッシュ
    event.respondWith(networkFirst(req, "./index.html"));
  } else {
    event.respondWith(DEV ? networkFirst(req) : cacheFirst(req));
  }
});
