import { h, toast, saveError, confirmSheet } from "../ui.js";
import { render } from "../router.js";
import { getApiKey, setApiKey, clearApiKey, getModel, setModel } from "../settings.js";
import { validModel, DEFAULT_MODEL } from "../lib/gemini.js";
import { getSetting, setSetting, storageEstimate } from "../db.js";
import { exportBackup, applyBackup } from "../store.js";
import { parseBackup, summarize, backupFileName, BackupError, BACKUP_ERROR_TEXT } from "../lib/backup.js";

const DAY = 24 * 60 * 60 * 1000;

// スマホは共有シート（ファイルアプリ・OneDrive などに保存できる）、PCはダウンロード
async function saveFile(blob, name) {
  const file = new File([blob], name, { type: "application/octet-stream" });
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "こんだてノートの書き出し" });
      return true;
    } catch (e) {
      if (e?.name === "AbortError") return false; // 利用者がやめた
      // 共有できなければダウンロードにする
    }
  }
  const url = URL.createObjectURL(file);
  const a = h("a", { href: url, download: name, class: "hidden" });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

async function doExport(btn) {
  btn.disabled = true;
  try {
    const blob = await exportBackup();
    if (await saveFile(blob, backupFileName())) {
      await setSetting("lastExportAt", Date.now());
      toast("書き出しました。OneDrive などに保存しておいてください");
    }
  } catch (e) {
    saveError(e);
  } finally {
    btn.disabled = false;
    render();
  }
}

async function doImport(file) {
  let data;
  try {
    data = await parseBackup(file);
  } catch (e) {
    toast(`${e instanceof BackupError ? BACKUP_ERROR_TEXT[e.code] : "ファイルを読めませんでした"}。今のデータはそのままです`);
    return;
  }
  const s = summarize(data);
  const ok = await confirmSheet(
    `今のデータをすべて消して、このファイルの内容（自分のレシピ${s.recipes}件・献立${s.meals}件・写真${s.photos}枚・買い物${s.shopping}件）に置き換えます。よろしいですか？`,
    "置き換える");
  if (!ok) return;
  try {
    await applyBackup(data);
    toast("読み込みました");
  } catch (e) {
    console.error(e);
    toast(e?.name === "QuotaExceededError"
      ? "保存する場所が足りず読み込めませんでした。今のデータはそのままです"
      : "読み込めませんでした。今のデータはそのままです");
  }
  render();
}

function lastExportNotice(at) {
  if (!at) return h("div", { class: "notice warn" }, "まだ書き出したことがありません。月に1回の書き出しがおすすめです");
  const d = new Date(at);
  const text = `最後の書き出し：${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return Date.now() - at > 30 * DAY
    ? h("div", { class: "notice warn" }, `${text}（1か月以上前です。書き出しておきましょう）`)
    : h("div", { class: "notice" }, `${text}。月に1回の書き出しがおすすめです`);
}

export async function configView() {
  const hasKey = !!getApiKey();

  // キーは画面に表示しない（入力欄はいつも空で出す）
  const keyInput = h("input", {
    type: "password", autocomplete: "off", spellcheck: "false", "aria-label": "Gemini APIキー",
    placeholder: hasKey ? "設定済み（変えるときだけ入力）" : "APIキーを入力",
  });
  const saveKey = () => {
    const v = keyInput.value.trim();
    if (!v) { toast("キーを入力してください"); return; }
    try { setApiKey(v); } catch (e) { saveError(e); return; }
    keyInput.value = "";
    toast("キーを保存しました");
    render();
  };

  const modelInput = h("input", { type: "text", value: await getModel(), "aria-label": "モデル名", spellcheck: "false", autocapitalize: "off" });
  const saveModel = async () => {
    const v = modelInput.value.trim() || DEFAULT_MODEL;
    if (!validModel(v)) { toast("モデル名は英数字・点・ハイフンで入れてください（例：gemini-2.5-flash）"); return; }
    try { await setModel(v); toast("モデル名を保存しました"); } catch (e) { saveError(e); }
  };

  // accept を付けない（iPhone で独自形式のファイルが選べなくなるため）
  const fileInput = h("input", { type: "file", class: "hidden", "aria-label": "読み込むファイル" });
  fileInput.addEventListener("change", () => {
    const f = fileInput.files[0];
    fileInput.value = "";
    if (f) doImport(f);
  });
  const exportBtn = h("button", { class: "btn" }, "📤 書き出す（写真もふくむ）");
  exportBtn.addEventListener("click", () => doExport(exportBtn));

  const est = await storageEstimate();
  const usage = est?.usage != null
    ? h("div", { class: "meta" }, `このアプリが使っている容量：約${(est.usage / 1024 / 1024).toFixed(1)}MB`)
    : null;

  return ["設定", h("div", { class: "stack" },
    h("h2", {}, "AI相談（Gemini）"),
    h("div", { class: "addrow" }, keyInput, h("button", { class: "btn", onclick: saveKey }, "保存")),
    hasKey
      ? h("button", { class: "btn small", onclick: () => { clearApiKey(); toast("キーを消しました"); render(); } }, "🗑 キーを消す")
      : null,
    h("div", { class: "meta" }, "キーはこのスマホの中だけに保存されます。書き出しファイルにも入りません。"),
    h("div", { class: "addrow" }, modelInput, h("button", { class: "btn", onclick: saveModel }, "保存")),
    h("div", { class: "meta" }, `モデル名（ふだんは ${DEFAULT_MODEL} のままでOK。「使えなくなっています」と出たら変えます）`),
    h("details", { class: "notice" },
      h("summary", {}, "APIキーの作り方（無料）"),
      h("ol", { class: "howto" },
        h("li", {}, "PCで Google AI Studio を開き、Googleアカウントでログイン"),
        h("li", {}, "「Get API key」→「APIキーを作成」。請求先（クレジットカード）を登録していないプロジェクトで作る＝お金はかかりません"),
        h("li", {}, "Google Cloud のキーの設定で、使えるAPIを「Generative Language API」だけに、使えるサイトをこのアプリのURLだけにする"),
        h("li", {}, "できたキーをこの欄に入れて「保存」")),
      h("div", { class: "meta" }, "無料枠では、送った内容（材料名）がGoogleの製品改善に使われることがあります。")),
    h("h2", {}, "データ"),
    exportBtn,
    h("button", { class: "btn", onclick: () => fileInput.click() }, "📥 読み込む"),
    fileInput,
    lastExportNotice(await getSetting("lastExportAt")),
    usage,
    h("div", { class: "meta" }, "読み込むと、今のデータはファイルの内容に置き換わります。機種変更のときは、前のスマホで書き出したファイルを新しいスマホで読み込みます。"),
    h("h2", {}, "使い方"),
    h("div", { class: "notice" }, "iPhone：Safariで開く →「共有」→「ホーム画面に追加」。追加したアイコンから開いて使ってください。アイコンを消すとデータも消えます。消す前に必ず書き出してください。"))];
}
