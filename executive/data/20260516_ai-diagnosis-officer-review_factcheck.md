# AI診断官レビュー サービス導線ファクトチェック記録（2026-05-16）

## 対象

- `src/pages/service.astro`
- `src/pages/spot-ticket.astro`
- `src/pages/spot-ticket-purchase.astro`
- `src/pages/spot-ticket-redeem.astro`
- `src/pages/free-diagnosis.astro`
- `src/pages/implementation.astro`
- `src/pages/index.astro`
- `src/pages/ai-diagnosis-officer.astro`
- `src/pages/ai-diagnosis-officer/apply.astro`
- `src/pages/api/ai-diagnosis-officer-session.ts`
- `src/pages/api/ai-diagnosis-officer-note.ts`
- `src/pages/ai-examples.astro`
- `src/pages/contact.astro`
- `src/pages/api/spot-ticket.ts`
- `src/lib/ai-diagnosis-review.ts`
- `src/lib/optiens-knowledge.ts`
- `executive/ai-consulting/サービスチケット定義.md`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/業務フロー定義.md`

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| スポット相談チケット価格は1枚¥33,000税込 | OK | `executive/ai-consulting/サービスチケット定義.md`、`src/pages/spot-ticket.astro`、購入フォームの価格表示と一致 |
| AI診断官レビューはスポット相談チケット1枚 | OK | 旧「AI活用レビュー面談」を、CEO方針に基づきAI診断官レビューへ再定義。公開ページ・購入フォーム・利用申請フォーム・APIメールラベルを同期 |
| 導入支援費へ充当しない | OK | サービスチケット定義と公開ページで、AI診断官レビュー費用は導入支援費へ充当しない表現を維持 |
| 詳細版AI活用診断にMTGを含めない | OK | `AGENTS.md` の収益モデルおよび有償版詳細レポート設計書と整合。追加レビューは別導線として扱う |
| 汎用AI音声相談との差別化 | OK | 「質問設計」「構造化」「成果物化」「次工程接続」に限定。外部サービス比較や優劣断定は行わず、Optiensの診断メソッドとして説明 |
| トップページでの訴求 | OK | `src/pages/index.astro` に、AI診断官レビューが音声相談を診断材料へ変える入口として、音声ヒアリング・構造化・次工程引き継ぎを短く追記 |
| 音声デモの技術方式 | OK | OpenAI公式ドキュメントで、Realtime API が音声対話に対応し、ブラウザでは WebRTC 接続が使えることを確認。標準APIキーはサーバー側でのみ使い、ブラウザへ露出しない実装にした |
| AI生成音声の明示 | OK | 音声デモページとシステム指示で、AI生成音声で応答することを明示。OpenAI公式TTSガイドの「AI生成音声の明示」要件に合わせた |
| アクセス制御・費用暴発対策 | OK | 公開環境では `AI_DIAGNOSIS_OFFICER_ENABLED=true` と、アクセスコードまたは `AI_DIAGNOSIS_OFFICER_PUBLIC_DEMO=true` がないと開始できない。IP単位の簡易レート制限も実装 |
| 購入前音声デモ | OK | CEO方針に合わせ、`/ai-diagnosis-officer` を購入前に体験できる公開デモとして案内。機密情報・個人情報・APIキーを話さない注意を画面とAI指示に残した |
| AI診断官レビュー専用申請フォーム | OK | `/ai-diagnosis-officer/apply` を追加し、チケット番号、今回聞きたいこと、業務概要、診断レポート参照情報、利用中ツールを送信できるようにした |
| 本番レビューURL案内 | OK | チケット番号確認後に、署名付きURLを受付メールへ記載する設計に変更。スポット相談チケット購入だけではレビュー開始にならない |
| 診断メモ生成 | OK | 会話後の価値を文字起こしではなく診断メモに定義。診断メモはチケット申請記録へ追記し、管理者メールにも通知する |
| 40,000円の外部サイト価格 | OK | 今回の自社サイト改修では掲載しない。外部サイト手数料込みの価格は別掲載時に個別確認する |

## 公開文で避ける表現

- 人間面談
- 詳細版付属MTG
- 無料MTG
- 導入費から引く相談
- 誰でもすぐ使える
- 必ず効果が出る
- 外部サイトでも同条件
- 人間が応答しているように見える表現
- 文字起こしを成果物として強調する表現
- 機密情報を安全に話せると誤解させる表現
- 常時無料・無制限に使える表現

## 元ソース匿名化チェック

- 不要
- 文字起こし由来コンテンツではない

## 参照元

- `AGENTS.md`
- `executive/ai-consulting/サービスチケット定義.md`
- `executive/ai-consulting/用語マスタ.md`
- `executive/ai-consulting/業務フロー定義.md`
- `executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md`
- `src/pages/spot-ticket.astro`
- `src/pages/api/spot-ticket.ts`
- OpenAI Realtime API with WebRTC: https://developers.openai.com/api/docs/guides/realtime-webrtc
- OpenAI Realtime conversations: https://developers.openai.com/api/docs/guides/realtime-conversations
- OpenAI Realtime transcription: https://developers.openai.com/api/docs/guides/realtime-transcription
- OpenAI Text to speech: https://platform.openai.com/docs/guides/text-to-speech
- Supabase JavaScript initializing: https://supabase.com/docs/reference/javascript/initializing
- Supabase changelog breaking changes: https://supabase.com/changelog?tags=breaking-change
