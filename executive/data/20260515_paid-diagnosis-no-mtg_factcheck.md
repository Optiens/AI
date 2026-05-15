---
date: 2026-05-15
scope: AI活用診断 詳細版の公開状態・MTG有無・添付対応・用語マスタ更新
owner: COO
status: completed
---

# 詳細版AI活用診断 定義更新ファクトチェック

## 確認対象

- 詳細版AI活用診断はMTGなしで統一する
- 詳細版の申込停止表示を解除する
- 詳細レポート設計書を現行実装に同期する
- 添付ファイル対応を現行フォーム仕様に合わせる
- 用語マスタを現行ホームページ基準で再設計し、ナレッジDBから参照できるようにする

## 参照した正本・実装

- `AGENTS.md`
  - AI支援事業の収益モデルは、無料レポートから詳細レポート、導入支援、保守へつなぐ方針
  - 公開ページ変更時は価格・提供範囲・MTG有無を社内事実と照合する必要あり
- `src/pages/index.astro`
  - 公開サービスの大枠は「AI業務自動化・AIエージェント導入支援」
  - AXの説明はAI Transformationとして定義
- `src/pages/service.astro`
  - サービス導線は AI活用診断、導入支援、保守
- `src/pages/free-diagnosis.astro`
  - 詳細版タブ、申込フォーム、画像アップロード、URL自動入力の現行実装を確認
- `src/pages/api/free-diagnosis.ts`
  - 詳細版の受付API、申込メール、振込案内、納期表現を確認
- `supabase/functions/process-paid-diagnosis/index.ts`
  - 詳細レポート生成、品質ゲート、Google Slides納品メールを確認
- `scripts/generate-paid-pptx.mjs`
  - 現行詳細版テンプレは19スライド構成
- 公開サイト `https://optiens.com/`, `https://optiens.com/service`, `https://optiens.com/free-diagnosis`
  - 2026-05-15時点でホームとサービスページの表現、診断ページの旧表示を確認

## 更新後の結論

- 詳細版AI活用診断は、税込5,500円の「詳細レポート」納品サービス
- 詳細版にMTGは含めない
- 追加相談が必要な場合は、AI活用レビュー面談または導入支援相談として別導線で案内する
- 詳細版は申込受付中として扱い、申込停止表示は解除
- 現行フォームの直接アップロード対応は JPG / PNG / GIF / WebP の画像と公開URL読取
- PDF / Excel / Word の直接添付は現行フォーム仕様としては書かない
- 詳細版設計書は19スライド構成と `process-paid-diagnosis` 実装を正として更新
- 用語マスタは現行ホームページ基準で再設計し、`term-master-ai-support` としてナレッジDBに追加

## 残リスク

- Vercel本番環境変数、Supabase Edge Function Secrets、Google SlidesテンプレIDの本番値は、デプロイ環境側で継続確認が必要
- 過去のアーカイブ、調査メモ、廃止商品案には旧方針の記述が残る可能性があるが、現行正本ではない
