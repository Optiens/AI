# AI診断官β・スポット相談チケット改定 ファクトチェック記録（2026-05-17）

## 対象

- `src/pages/ai-diagnosis-officer.astro`
- `src/pages/spot-ticket.astro`
- `src/pages/spot-ticket-purchase.astro`
- `src/pages/spot-ticket-redeem.astro`
- `src/pages/service.astro`
- `src/pages/implementation.astro`
- `src/pages/index.astro`
- `src/pages/free-diagnosis.astro`
- `src/pages/free-diagnosis-thanks.astro`
- `src/pages/ai-examples.astro`
- `src/pages/partners.astro`
- `src/pages/contact.astro`
- `src/content/blog/20260423-business-direction.md`
- `src/content/blog/20260505-free-diagnosis-report-content.md`
- `src/content/blog/20260508-5days-bootcamp-launch-analysis.md`
- `src/content/blog/20260508-hokuto-yamanashi-ai-support.md`
- `executive/ai-consulting/サービスチケット定義.md`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/スポットチケット_商品設計書_v1.0.md`
- `supabase/migrations/20260517_ai_diagnosis_officer_usage.sql`
- `supabase/migrations/20260517_service_ticket_beta_policy_knowledge.sql`

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| AI診断官βの位置づけ | OK | ユーザー方針に基づき、独立した33,000円商品ではなく、入口・体験デモ・詳細版AI活用診断の追加ヒアリング・診断メモ生成として定義した |
| 詳細版AI活用診断 | OK | `AGENTS.md` の収益モデルどおり、無料レポート→詳細レポート（¥5,500税込・MTGなし）→導入支援の導線を維持した |
| 単発AI相談 | OK | スポット相談チケット1枚、60分目安、人間相談、導入支援費への充当なしとして公開文言を限定した |
| 有償要件定義 | OK | チケット2枚に変更し、導入支援成約時は2枚分を初期費用へ充当、不成約時は返金しない方針として正本・公開ページを更新した |
| 音声βの注意書き | OK | 音声モードは静かな環境向け、声の選択不可、機密情報・個人情報・APIキーを話さないことを公開ページに記載した |
| 音声の安定化 | OK | OpenAI Realtime VADの `threshold` を高め、`silence_duration_ms` を長めにし、AI応答中の割り込みを抑制する設定にした |
| テキストモード併設 | OK | 騒がしい環境やマイク不安定時の代替として、AI診断官βページにテキスト相談と診断メモ生成を追加した |
| usage原価計測 | OK | OpenAI Realtimeの `response.done` に含まれるusageを受け取り、セッション単位でトークン・推定原価をDBへ保存し、管理画面に表示する実装を追加した |
| API価格表現 | 注意付きOK | 原価はOpenAI公式Pricingの単価と環境変数の上書き値から算出する推定値。請求確定値とは表現しない |
| DB公開範囲 | OK | `ai_diagnosis_officer_sessions` はRLS有効、anon/authenticated権限を剥奪、service_roleのみ操作可。文字起こし本文や診断メモ本文は保存しない |

## 公開文で避ける表現

- 「AI診断官レビューを33,000円で提供」
- 「AI診断官βの声を選択できます」
- 「騒がしい環境でも音声で安定して利用できます」
- 「診断メモは正式見積です」
- 「単発AI相談の費用を導入支援費へ充当します」
- 「有償要件定義はチケット1枚」
- 「API原価は請求確定値です」

## 参照元

- `AGENTS.md`
- `executive/ai-consulting/サービスチケット定義.md`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/スポットチケット_商品設計書_v1.0.md`
- OpenAI Realtime guide: https://platform.openai.com/docs/guides/realtime
- OpenAI Realtime VAD guide: https://platform.openai.com/docs/guides/realtime-vad
- OpenAI Pricing: https://platform.openai.com/docs/pricing
- Supabase RLS / API security reference: https://supabase.com/docs/guides/api/securing-your-api
