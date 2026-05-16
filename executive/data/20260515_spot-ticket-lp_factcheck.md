# スポット相談チケットLP・サービス導線 ファクトチェック記録（2026-05-15）

## 対象

- `src/pages/service.astro`
- `src/pages/index.astro`
- `src/pages/free-diagnosis.astro`
- `src/pages/maintenance.astro`
- `src/pages/spot-ticket.astro`
- `src/pages/spot-ticket-purchase.astro`
- `src/pages/spot-ticket-redeem.astro`
- `src/pages/spot-ticket-success.astro`
- `src/pages/contact.astro`
- `src/pages/api/contact.ts`
- `src/pages/api/spot-ticket.ts`
- `src/pages/api/spot-ticket-payment-notify.ts`
- `src/pages/api/payment-check.ts`
- `src/pages/spot-ticket-payment-notify.astro`
- `src/lib/spot-ticket-billing.ts`
- `executive/ai-consulting/サービスチケット定義.md`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/スポットチケット_商品設計書_v1.0.md`
- `supabase/migrations/20260515122926_service_ticket_knowledge.sql`
- `supabase/migrations/20260516_spot_ticket_order_payment_flow.sql`

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| スポット相談チケットは1枚¥33,000（税込、税抜¥30,000） | OK | CEO指示および `executive/ai-consulting/サービスチケット定義.md` と照合。購入者が実際に振り込む金額と一致するよう、公開ページでは税込価格を主表示し、税抜価格を補足する |
| AI活用レビュー面談はスポット相談チケット1枚 | OK | CEO指示および社内定義と照合。導入支援費には充当しない相談サービスとして記載 |
| 有償要件定義はスポット相談チケット1枚 | OK | CEO指示および社内定義と照合。導入支援成約時のみ初期費用へ充当する扱いを維持 |
| 簡易実装・軽微な自動化対応は3枚から | OK | CEO指示および社内定義と照合。1業務・1フロー・既存ツール前提の範囲に限定 |
| 購入後にチケット番号を発行し、番号で利用申請する導線 | OK | CEO方針として採用。1〜3枚は購入申込後に振込先案内・請求情報・振込完了通知URLを自動送信し、freee入金照合後にチケット番号を自動発行する実装へ更新 |
| freee入金照合 | OK | 既存の詳細版AI活用診断の `payment-check` / `payment-notify` と同じ freee wallet transaction 取得・金額一致・会社名ファジーマッチ方針をスポット相談チケットへ横展開 |
| 急ぎの入金確認導線 | OK | `vercel.json` の `/api/payment-check` Cron は `0 0 * * *`（JST 9:00）で1日1回。顧客クリックの振込完了通知URLと、問い合わせフォーム `topic=spot-ticket-urgent-payment` を併記し、即時保証ではなく確認依頼の入口として記載 |
| Stripe連携 | 保留 | 現時点ではStripeパッケージ、Stripe APIキー、Webhook署名シークレット、決済商品設定が未確認のため公開実装しない。銀行振込 + freee照合を先行 |
| 相談・要件整理カードのリンク先 | OK | `/contact` 直行から `/spot-ticket` へ変更し、購入導線を明確化。購入申込は `/spot-ticket-purchase`、発行済みチケットの利用申請は `/spot-ticket-redeem` に分離し、`/spot-ticket#purchase` と `/spot-ticket#redeem` は専用ページへの案内導線として残す |
| 社内ナレッジの価格・フォーム定義 | OK | Supabase `knowledge_entries` の `service-ticket-menu-policy` / `maintenance-ticket-plan-policy` を税込¥33,000基準へ更新し、購入申込フォームを `/spot-ticket-purchase`、利用申請フォームを `/spot-ticket-redeem` として記録 |
| 4ステップ内の相談・要件整理画像 | OK | 写真調の `banner-consultation.webp` から、既存3カードと同系統のイラスト調 `step-02-consultation.webp` へ変更 |
| 禁止事項・旧方針 | OK | 宇宙農業、SaaS外販、医療機関、防災拠点、家庭向け等の禁止領域は追加していない |
| 外部事実 | OK | 価格・提供範囲は社内定義に基づくため、外部事実の新規主張なし。Supabase DB更新は公式ChangelogでDB関連の破壊的変更有無を確認し、今回の既存テーブル更新に影響なしと判断 |

## 公開文で避ける表現

- 「購入直後にチケット番号を発行」など、入金前に発行されるように見える表現
- 「急ぎなら即時発行」など、銀行・freee反映前のチケット番号発行を保証する表現
- 「必ず導入支援に進める」「どんな自動化でも3枚で対応」など、提供範囲を超える表現
- 「1回3万円」など、スポット相談チケットの単位と混ざる表現
- 「3万円（税込）」や「¥30,000（税込）」など、税抜額と税込額が混ざる表現

## 元ソース匿名化チェック（文字起こし由来の場合）

- 不要
- 確認内容: 文字起こし由来コンテンツではない

## 参照元

- `AGENTS.md`
- `executive/ai-consulting/サービスチケット定義.md`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/スポットチケット_商品設計書_v1.0.md`
- `src/pages/service.astro`
- `src/pages/spot-ticket.astro`
- `src/pages/spot-ticket-purchase.astro`
- `src/pages/spot-ticket-redeem.astro`
- `src/pages/contact.astro`
- `src/pages/api/spot-ticket-payment-notify.ts`
- `vercel.json`
- `src/lib/spot-ticket-billing.ts`
- Supabase Changelog: https://supabase.com/changelog?tags=database
