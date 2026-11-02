# こんだてノート 設計書（PLAN）

作成日: 2026-11-02 / 対応する仕様: docs/SPEC.md

## 1. システム構成

```
[スマホのブラウザ]
  ├─ こんだてノート（HTML/CSS/JS） ← GitHub Pages から配信（無料）
  ├─ localStorage   … 設定（人数の初期値、AIキー、モデル名）
  ├─ IndexedDB      … 自分のレシピ／献立／記録／写真／買い物リスト
  └─ Service Worker … 一度開けばオフラインでも動く（AI以外）
        │
        └─（AI相談のときだけ）→ Google Gemini API（無料枠）
             送るもの：材料名と質問文のみ
```

サーバーは持たない。データは利用者のスマホの中だけに保存する。

## 2. 使用技術
| 項目 | 採用 | 理由 |
|---|---|---|
| 画面 | HTML / CSS / JavaScript（フレームワークなし、ESモジュール） | ビルド不要でGitHub Pagesにそのまま置ける。ホームページ制作の基礎がそのまま学べる。依存ライブラリなし＝壊れにくい |
| 画面切替 | URLの `#` で切り替える自作ルーター | 1ページで複数画面を扱える。サーバー設定不要 |
| 保存 | IndexedDB（写真・記録など）＋ localStorage（設定） | 写真のような大きいデータはIndexedDB |
| オフライン | PWA（manifest.json ＋ Service Worker） | ホーム画面にアイコンを置ける。電波が弱いスーパーでも開ける |
| AI | Gemini API（REST、ブラウザから直接） | 無料枠あり、クレカ不要。モデル名は設定で変更可（初期値 gemini-2.5-flash） |
| テスト | Node.js 標準の `node:test`（計算ロジック）＋ Playwright（スマホ幅での画面確認） | node:test は追加インストールなし。Playwright は開発用にだけ入れ（devDependencies）、ブラウザはPCの Edge を使う。アプリ本体には入らない |

## 3. データ構造

### レシピ（内蔵: js/data/recipes.js、自作: IndexedDB `recipes`）
```js
{
  id: "pasta-001" | "my-<時刻>",
  name: "ナポリタン",
  genre: "pasta" | "don" | "meat" | "fish" | "noodle" | "western" | "chinese" | "soup" | "side",
  minutes: 15, difficulty: 1-3,
  servings: 1,                       // 分量は1人分で持つ
  ingredients: [
    { name: "スパゲッティ", amount: 100, unit: "g" },
    { name: "塩", amount: null, unit: "少々", seasoning: true }  // 数値なしは人数で変えない
  ],
  steps: ["…", "…"],
  tools: ["frypan"],                 // frypan / pot / microwave / ricecooker
  custom: false
}
```

### 献立・記録（IndexedDB `meals`）
```js
{ id, date: "2026-11-03", slot: "lunch" | "dinner", recipeId, servings, done: false, photoId: null, memo: "" }
```
同じ日・同じ枠は1件（上書き）。

### 写真（IndexedDB `photos`）
`{ id, blob }` … 長辺1280px・JPEG品質0.7に圧縮して保存。

### 買い物リスト（IndexedDB `shopping`）
`{ id, name, amount, unit, checked, fromMealIds: [] }` … 同じ名前・同じ単位は合算。

## 4. 画面（下に5つのタブ）
```
[🏠 きょう] [📅 カレンダー] [🔍 さがす] [🛒 買い物] [⚙️ 設定]
```
- きょう: 今日の昼・夜の献立。「ジャンルで選ぶ」「ランダム」「1週間分決める」「残り材料で相談」
- カレンダー: 月表示。料理がある日に印、写真がある日はサムネイル。日付タップで詳細＋「作った！📷」
- さがす: 料理名・材料名検索、ジャンル絞り込み、「＋自分のレシピ」
- レシピ詳細: 人数ボタン（−/＋）、材料、作り方、「この料理に決める（昼/夜）」「買い物リストへ」
- 買い物: チェックリスト、手動追加、チェック済みを消す
- 設定: AIキー・モデル名、書き出し／読み込み、使い方

## 5. ロジック
- 人数計算: amount × 人数。表示は 0.5 単位や 1/2 などで丸める（g は整数、大さじ等は 0.5 刻み）
- ランダム: 全レシピ（副菜を除く）から完全ランダム。1週間分のときだけ、同じ週の中で同じ料理が重ならないようにする
- 残り材料: 入力された材料と、レシピの「調味料以外の材料」を照合し、一致率の高い順に表示。表記ゆれ（ひらがな／カタカナ、「豚こま」→「豚肉」など）は簡単な読み替え表で吸収
- AI: 材料と「1人分、オーブンなし、コンロ1口、電子レンジ・炊飯器あり」の条件を付けて相談。結果は文章で表示し、「自分のレシピとして保存」できる

## 6. セキュリティ
- 利用者が入力した文字（自作レシピ、AIの返答）は textContent で表示し、HTMLとして解釈させない（XSS対策）
- AIキーはコード・GitHub・書き出しファイルに含めない。localStorage のみに保存。設定画面で削除可能
- Content-Security-Policy を設定し、外部への通信を Gemini API のみに限定
- GitHub PagesのURLにユーザー名が入るので、本名でないことを公開前に確認

【解説】XSS：入力欄に仕込まれたプログラムが画面に表示されたときに動いてしまう攻撃。AIの返答も念のため同じ扱いにする。

## 7. ファイル構成
```
kondate-app/
├─ index.html
├─ manifest.json / sw.js / icons/
├─ css/style.css
├─ js/
│  ├─ app.js          画面切替・タブ
│  ├─ db.js           IndexedDB の読み書き
│  ├─ data/recipes.js 内蔵レシピ100品
│  ├─ lib/scale.js    人数計算
│  ├─ lib/match.js    残り材料の照合
│  ├─ lib/shopping.js 買い物リストの合算
│  ├─ lib/backup.js   書き出し・読み込み
│  ├─ lib/photo.js    写真の圧縮
│  ├─ lib/gemini.js   AI相談
│  └─ views/          各画面
├─ tests/             node:test と Playwright
├─ docs/ SPEC.md PLAN.md PROJECT_STATUS.md
└─ RECOVERY.md
```

## 8. 実装順序
1. UI試作（ダミー数品で全画面）→ スマホ幅で確認してもらう
2. 保存の仕組み（db.js）と人数計算・買い物合算
3. 献立決定（ジャンル・ランダム・1週間）とカレンダー
4. 写真撮影・記録
5. 検索・自作レシピ
6. 残り材料照合 → Gemini連携
7. 書き出し・読み込み
8. 内蔵レシピ100品の作成とチェック（オーブン不使用・コンロ1口）
9. PWA化、テスト、GitHub Pagesに公開

## 9. テスト
- 単体: 人数計算、買い物合算、材料照合、書き出し→読み込みで元に戻ること、読み込み失敗時に元データが残ること
- レシピデータ: 100品すべてに必須項目があること、tools にオーブン・トースターがないこと
- 画面: Playwright でスマホ幅（390px）にして主要操作を一通り
- 実機: 利用者のスマホで写真撮影・ホーム画面追加を確認（こちらでは確認できない部分）

## 10. バックアップ・復旧
- ソースは GitHub リポジトリにも残る
- 規定のバックアップ先（PCのOneDrive内 clodecode フォルダ）へは、PCと連携できたときにコピーする
- ※リポジトリは公開されるため、PC内のパスやユーザー名は docs に書かない
- 利用者のデータ（献立・写真）は、アプリの「書き出し」で作ったファイルを OneDrive などに保存してもらう

## 11. コスト
すべて無料（GitHub Pages、Gemini API無料枠）。有料サービスは使わない。

## 12. リスク
| リスク | 対策 |
|---|---|
| ブラウザのデータ消去で記録が消える | 書き出し機能。月1回の書き出しを設定画面で案内 |
| Gemini無料枠の回数・モデルが変わる | モデル名を設定で変更可能に。失敗しても内蔵レシピの結果は表示 |
| iPhoneのSafariは長期間開かないとデータを消すことがある | ホーム画面に追加して使うよう案内（追加すると消されにくい） |
| 写真で容量がいっぱいになる | 圧縮、残り容量の表示、書き出しのすすめ |

## 13. 独立レビューの反映（2026-11-02）

### 公開場所
- `ユーザー名.github.io` の下は、同じアカウントの全サイト（例: ポートフォリオ）と保存領域を共有してしまう
  → アプリ専用の無料 GitHub Organization（`org名.github.io`）で公開し、保存領域を分ける【利用者に確認】
- すべて相対パス（`./css/...`）。manifest は `start_url: "./"` `scope: "./"`、`register('./sw.js')`

### iPhone対策
- Safariのタブとホーム画面アプリは保存領域が別 → 初回に「ホーム画面に追加して使う」案内を出し、タブで開いたら警告
- `navigator.storage.persist()` で消えにくくする
- ホーム画面アイコンを消すとデータも消える旨を、書き出しの案内に入れる
- 写真入力は `<input type="file" accept="image/*">`（capture を付けない＝撮影もアルバム選択もできる）

### 書き出し・読み込み
- JSONに写真を埋め込まず、「ヘッダJSON＋写真Blob」を連結した独自形式（大量の写真でも落ちない）
- 写真は長辺1024px・品質0.6
- 読み込みは「置き換え」（確認ダイアログあり）。全ストアを1トランザクションで入れ替え、失敗時は元データが残る
- 保存は `navigator.share({files})` を優先、使えなければダウンロード
- APIキーは書き出しに含めず、読み込んだファイルにあっても無視

### データ
- 日付キーは端末の時刻で作る関数1つに統一（toISOString は使わない）
- id は `crypto.randomUUID()`
- 献立に料理名もコピーして保存（レシピ削除後も記録が残る）
- 1週間分の自動決定は「作った」記録を上書きしない。上書きで不要になった写真は削除
- 設定もAPIキー以外は IndexedDB に一本化
- 分量は小数（0.5刻み）表示のみ。買い物リストの fromMealIds は省略

### AI（Gemini）
- キーは `x-goog-api-key` ヘッダで送る。入力欄は password 型、console に出さない
- 請求先（課金アカウント）のない Google Cloud プロジェクトでキーを作る（これで課金されない）
- キーに制限: 使えるAPIを Generative Language API のみ／使えるサイトを公開URLのみ
- 429・401/403・404（モデル終了）・5xx・タイムアウト（AbortController）・オフライン・安全フィルタの各表示。自動再試行なし、返答待ち中はボタン無効
- 返答は「装飾なしの文章」で依頼。保存は構造化出力（JSON）で材料・手順を受け取る
- 材料欄に個人情報を書かない注意書き

### セキュリティ
- CSP は meta タグで最初に記述: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self' https://generativelanguage.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'none'`
- inline script / style 属性は使わない。innerHTML に利用者・AI由来の文字を入れない
- GitHub の push protection（秘密情報の検知）を有効化

### Service Worker
- キャッシュ名 `kondate-v<版>`、activate で自分の古い版だけ削除
- index.html は通信優先、それ以外はキャッシュ優先。更新時は「再読み込み」ボタン。Gemini 通信は素通し

### レシピ作成
- 段階的に作る: まず30品で全機能を完成 → 100品まで追加
- 手順の文章に「オーブン/トースター/グリル」が無いか自動検査。魚料理はフライパン調理に
- コンロ1口は自動判定できないため、人の目のチェックリストで確認

### テスト追加
- 日付（日本時間0〜9時、月末・年末）、書き出し→読み込みで写真が1バイトも変わらない、壊れた/途中/版違いファイル
- ランダム: 対象が14品未満の1週間分、ジャンル0件
- 人数計算の誤差・上下限・null・単位違い、Gemini の各エラー（通信をダミーに差し替え）、XSS文字列
- サブパス配信・オフライン起動・CSP違反なし（Playwright）
- 実機チェックリスト（Safariタブとホーム画面の違い、写真選択、ファイル保存と読み込み、容量不足）
