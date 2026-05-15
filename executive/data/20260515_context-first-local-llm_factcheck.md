# ローカルLLM長文処理とコンテキストファースト設計 ファクトチェック記録（2026-05-15）

## 対象

- `src/content/blog/20260515-context-first-local-llm.md`
- CEO共有の文字起こしをもとに、Optiens向けに再構成したブログ記事。

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| 長文入力では、関連情報の位置によりLLMの性能が変わりうる | OK | Liu et al. “Lost in the Middle” で、関連情報が入力の冒頭または末尾にある場合に性能が高く、中央にある場合に低下しやすい傾向が報告されている。記事では「中央の情報を必ず失う」ではなく「落ちやすい傾向」と表現した。 |
| Attention sink という現象が初期トークンへの強い注意に関係する | OK | Xiao et al. “Efficient Streaming Language Models with Attention Sinks” で、初期トークンに強い attention score が集まる現象が説明されている。記事では専門語を補足扱いにし、単純に「AIは先頭を読む」とは断定しない。 |
| OllamaのModelfileで `SYSTEM` / `TEMPLATE` / `PARAMETER num_ctx` を扱える | OK | Ollama公式 Modelfile Reference で `TEMPLATE` はモデルへ送る完全なプロンプトテンプレート、`SYSTEM` はテンプレートにセットされるシステムメッセージ、`num_ctx` はコンテキストウィンドウサイズを設定する例として確認。 |
| Ollamaでは常に「モデルファイル → セッションプロンプト → カスタムプロンプト → メモリ → ユーザー入力」の順になる | 削除 | 文字起こし中の特定アプリ実装に依存する説明で、Ollama一般の仕様としては確認できない。記事では「テンプレート次第で順序を設計できる」と表現した。 |
| 小規模モデルは大規模モデルよりノイズが少ない | 削除 | 一般論として公開できる一次情報が不十分。記事では「小さなモデルは軽く動かせる一方、文脈長や精度はモデルごとの差が大きい」と弱めた。 |
| コンテキストファーストは常に最善である | 要修正 | 研究・公式ドキュメントからは用途横断の絶対則とは言えない。記事では「長文要約や資料読解で試す価値がある設計パターン」とし、短いタスクや強い制御が必要な場合はプロンプトファーストも選択肢とした。 |
| 画像生成モデルは Imagen Ultra 最新安定版を使う | OK | Google Cloud公式の Imagen 4 ドキュメントで `imagen-4.0-ultra-generate-001` を確認。スクリプト既定値も同モデル。 |
| frontmatter と画像パスの整合性 | OK | 記事 `image` は `/images/blog/20260515-context-first-local-llm.webp`。実ファイル `public/images/blog/20260515-context-first-local-llm.webp` の存在を確認。 |

## 公開文で避ける表現

- 「必ず精度が上がる」
- 「小規模モデルの方が大規模モデルより優れている」
- 「Ollamaでは入力順序が常に固定される」
- 「AIは文章の最初と最後だけを見る」
- 文字起こし元の話者名、チャンネル名、固有アプリ名、宣伝CTA、個人的なデモ例

## 元ソース匿名化チェック（文字起こし由来）

- 判定: 済
- 確認内容:
  - 動画タイトル・話者名・チャンネル名・イベント名・宣伝CTAは本文に記載しない。
  - 元動画の具体デモ例、スコア比較、個人的な設定例は使用しない。
  - 構成は「業務課題 → 技術背景 → 設計パターン → 実装チェックリスト」に再構成した。
  - Optiens読者向けに、議事録要約、社内規程検索、問い合わせ分類、CRMメモ整理の例へ置き換えた。

## 参照元

- Lost in the Middle: How Language Models Use Long Contexts: https://arxiv.org/abs/2307.03172
- Efficient Streaming Language Models with Attention Sinks: https://arxiv.org/abs/2309.17453
- Ollama Modelfile Reference: https://docs.ollama.com/modelfile
- Imagen 4 / Vertex AI documentation: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate

## 公開前検証

- `rg` により、公開記事本文に元動画の話者名、固有アプリ名、宣伝要素、スコア比較が残っていないことを確認。
- `git diff --check` 実行済み（改行コード警告のみ）。
- `npm run build` 実行済み。`/blog/20260515-context-first-local-llm/` の prerender を確認。
