---
date: 2026-05-17
scope: AI活用診断 詳細版の価値定義・公開文言・社内資料整理
owner: COO
status: checked
---

# 詳細版AI活用診断 価値定義・文言整理 ファクトチェック

## 対象

- `src/pages/free-diagnosis.astro`
- `src/pages/free-diagnosis-thanks.astro`
- `src/pages/index.astro`
- `src/pages/service.astro`
- `src/lib/optiens-knowledge.ts`
- `executive/ai-consulting/無料版vs有償版_定義.md`
- `executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/無料診断Slidesテンプレ仕様.md`
- `executive/ai-consulting/blog-service-claim-rules.md`
- `executive/ai-consulting/業務フロー定義.md`
- `supabase/migrations/20260515153000_term_master_and_paid_no_mtg_knowledge.sql`

## 確認した正本

- `AGENTS.md`: 詳細版AI活用診断は¥5,500税込、MTGなし、導入可否・優先順位・構成案・費用前提を整理する。
- `executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md`: 詳細版はGoogle Slides URL納品、入金確認後5営業日以内、画像1点または公開URL1件まで、PDF/Excel/Word直接添付なし。
- `executive/ai-consulting/用語マスタ.md`: 詳細版は申込受付中、60分MTGなし、追加レビューはAI診断官レビューまたは導入支援相談で別導線。
- `executive/ai-consulting/blog-service-claim-rules.md`: 詳細版の近くでMTG、面談、実装、テスト、修正実装、導入作業を約束しない。

## 判断

顧客が詳細フォームの内容をChatGPT等の汎用AIへ入力すれば、近い一般診断は無料で得られる可能性がある。
したがって、詳細版AI活用診断の価値を「AIが答えること」や「汎用AI相談の代行」に置く表現は避ける。

今回の正しい価値定義は以下。

- フォーム回答をOptiensの診断基準で整理する。
- 優先順位、やらないこと、費用前提、次の一手を導入判断資料として残す。
- 構成案や概算費用は正式見積・完成設計書ではなく、導入支援に進むか判断するための前提として扱う。
- 60分MTGは含めない。追加確認はAI診断官レビュー、スポット相談、有償要件定義、導入支援で扱う。
- ChatGPTではできない、と断定しない。

## 修正方針

- 公開ページでは競合名を前面に出さず、「汎用AI相談の代行ではなく、導入判断に使える資料」という表現にする。
- 社内資料ではChatGPT代替可能性を明記し、¥5,500の価値を判断材料の整理に置く。
- 「アーキテクチャ図」「導入見積」を強く約束する表現は、「構成案」「概算費用」「費用前提」へ寄せる。
- 詳細版の資料読取上限は既存方針どおり、画像1点または公開URL1件までを維持する。

## 公開前チェック

- `rg` で主要な旧表現を確認する。
- `npm run build` を実行する。
- `git diff --check` を実行する。
