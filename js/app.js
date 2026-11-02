// 入口。画面を登録して最初の描画をする
import { setViews, start } from "./router.js";
import { requestPersist } from "./db.js";
import { todayView } from "./views/today.js";
import { calendarView } from "./views/calendar.js";
import { searchView } from "./views/search.js";
import { shoppingView } from "./views/shopping.js";
import { configView } from "./views/config.js";

setViews({
  today: todayView,
  calendar: calendarView,
  search: searchView,
  shopping: shoppingView,
  config: configView,
});

start();
requestPersist();
registerServiceWorker();

// オフライン対応。新しい版が届いたら「再読み込み」ボタンを出す
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // 再読み込みは利用者がボタンを押したときだけ（初めて入ったときにも controllerchange が起きるため）
  let requested = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!requested) return;
    requested = false;
    location.reload();
  });
  try {
    const reg = await navigator.serviceWorker.register("./sw.js");
    const offer = worker => {
      const bar = document.getElementById("update");
      bar.classList.remove("hidden");
      document.getElementById("reload").onclick = () => { requested = true; worker.postMessage("skipWaiting"); };
    };
    // 初めて入れたとき（controller がない）は案内しない
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w?.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller) offer(w);
      });
    });
  } catch (e) {
    console.warn("Service Worker を登録できませんでした", e);
  }
}
