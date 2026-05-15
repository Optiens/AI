# スポット相談チケットLP・サービス導線 ファクトチェック記録（2026-05-15）

## 対象

- `src/pages/service.astro`
- `src/pages/index.astro`
- `src/pages/free-diagnosis.astro`
- `src/pages/maintenance.astro`
- `src/pages/spot-ticket.astro`
- `src/pages/spot-ticket-success.astro`
- `src/pages/api/spot-ticket.ts`
- `executive/ai-consulting/サービスチケット定義.md`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/スポットチケット_商品設計書_v1.0.md`
- `supabase/migrations/20260515122926_service_ticket_knowledge.sql`

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| スポット相談チケットは1枚¥30,000（税抜） | OK | CEO指示および `executive/ai-consulting/サービスチケット定義.md` と照合。公開ページでは購入単位として表示 |
| AI活用レビュー面談はスポット相談チケット1枚 | OK | CEO指示および社内定義と照合。導入支援費には充当しない相談サービスとして記載 |
| 有償要件定義はスポット相談チケット1枚 | OK | CEO指示および社内定義と照合。導入支援成約時のみ初期費用へ充当する扱いを維持 |
| 簡易実装・軽微な自動化対応は3枚から | OK | CEO指示および社内定義と照合。1業務・1フロー・既存ツール前提の範囲に限定 |
| 購入後にチケット番号を発行し、番号で利用申請する導線 | OK | CEO方針として採用。現時点の実装は購入申込・利用申請メール通知までで、番号の自動発行や決済自動照合は未実装 |
| 相談・要件整理カードのリンク先 | OK | `/contact` 直行から `/spot-ticket` へ変更し、購入・利用申請を顧客が選べる導線に修正 |
| 4ステップ内の相談・要件整理画像 | OK | 写真調の `banner-consultation.webp` から、既存3カードと同系統のイラスト調 `step-02-consultation.webp` へ変更 |
| 禁止事項・旧方針 | OK | 宇宙農業、SaaS外販、医療機関、防災拠点、家庭向け等の禁止領域は追加していない |
| 外部事実 | OK | 価格・提供範囲は社内定義に基づくため、外部事実の新規主張なし。Supabase DB更新は公式ChangelogでDB関連の破壊的変更有無を確認し、今回の既存テーブル更新に影響なしと判断 |

## 公開文で避ける表現

- 「購入後すぐ自動でチケット番号を発行」など、自動化済みに見える表現
- 「必ず導入支援に進める」「どんな自動化でも3枚で対応」など、提供範囲を超える表現
- 「1回3万円」など、スポット相談チケットの単位と混ざる表現

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
- Supabase Changelog: https://supabase.com/changelog?tags=database
