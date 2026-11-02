# こんだてノート — Claude Code 向けメモ

最初に docs/SPEC.md・docs/PLAN.md（特に13章）・docs/PROJECT_STATUS.md を読むこと。
画面の見た目と構成は prototype/index.html を正とする。

## 守るルール
- 素のHTML/CSS/JS（ESモジュール）。ライブラリ・ビルドツールは追加しない
- パスはすべて相対パス（GitHub Pagesのサブパスで配信するため）
- inline の <script> と style="" は使わない（CSPのため）
- 利用者入力・AIの返答・読み込んだファイルの文字は textContent で表示し、innerHTML に入れない
- 日付キーは端末の時刻で作る共通関数を使う（toISOString は使わない）
- id は crypto.randomUUID()
- Gemini のAPIキーはコード・リポジトリ・書き出しファイルに絶対に入れない（localStorage のみ）
- 費用は無料のみ。有料サービスを使う場合は必ず利用者に相談
- オーブン・トースター・魚焼きグリルを使うレシピは入れない。コンロ1口で作れる手順にする
- docs にPC内のパスや本名を書かない（リポジトリは公開される）
