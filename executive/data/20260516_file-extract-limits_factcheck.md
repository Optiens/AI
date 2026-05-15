---
date: 2026-05-16
scope: AI活用診断フォームの画像/URL自動読取上限
owner: COO
status: completed
---

# 画像/URL自動読取上限 ファクトチェック記録（2026-05-16）

## 対象

- `src/pages/free-diagnosis.astro`
- `src/pages/api/file-extract.ts`
- `executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md`
- `executive/ai-consulting/無料版vs有償版_定義.md`
- `executive/ai-consulting/用語マスタ.md`
- `src/lib/optiens-knowledge.ts`

## 判定

修正後公開可。

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| 自動読取の数量 | OK | 1申込につき画像1点またはURL1件までと明記。クライアント側でも成功後の再読取を止める |
| 画像上限 | OK | 現行実装に合わせJPG / PNG / GIF / WebP、最大5MB。OpenAI Visionは低解像度読取で処理 |
| URL上限 | OK | 取得HTML最大512KB、AIへ渡す本文最大約6,000字に抑制 |
| 公開ページ上の告知 | OK | 詳細版タブの上部と自動入力欄の両方で、画像1点または公開URL1件までの上限を明記 |
| 利用回数 | OK | `/api/file-extract` はIP単位で1時間3回を標準上限に変更 |
| PDF / Excel / Word | OK | 現行フォームでは直接添付しない。必要内容は自由記述または別相談で扱う |
| API利用料リスク | OK | 大量資料を丸ごとLLM投入しない方針を設計書・用語マスタ・ナレッジに反映 |

## 公開文で避ける表現

- 「資料をいくつでも読み込めます」
- 「PDF、Excel、Wordもそのまま自動読取できます」
- 「大量資料を丸ごと解析します」
- 「どんなURLでも読めます」

## 参照元

- `src/pages/api/file-extract.ts`
- `src/pages/free-diagnosis.astro`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md`
