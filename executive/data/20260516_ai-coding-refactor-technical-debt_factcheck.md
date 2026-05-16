# AIコーディングで技術的負債を増やさない ファクトチェック記録（2026-05-16）

## 対象

- `src/content/blog/20260516-ai-coding-refactor-technical-debt.md`
- `public/images/blog/20260516-ai-coding-refactor-technical-debt.webp`
- 文字起こし由来の社内ナレッジ:
  - `executive/data/transcript-insights/20260516_reference_ai_coding_refactoring_technical_debt.md`

## 判定

- 修正後公開可
- 文字起こしは事実源として扱わず、外部事実は一次情報または公式情報で確認した。

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| リファクタリングの定義 | OK | Martin Fowler公式ページで、既存コードの設計を改善する制御された技法であり、小さな振る舞い保存の変更を積み重ねる旨を確認。本文では「動作を変えずに既存コードの設計を改善」と表現した。 |
| AI生成コードの人間責任 | OK | OWASP Secure Coding with AI Cheat Sheetで、AI生成コードには人間の所有者、レビュー、承認が必要と確認。本文では「人間が読んで責任を持てる状態」とした。 |
| AI生成コードのレビュー・理解 | OK | OWASP Top 10 2025 Next Stepsで、AIが書いたコードでも提出者が理解し、脆弱性レビューを行うべきと確認。本文ではAIレビューを人間レビューの代替にしない表現にした。 |
| GitHub Copilot code reviewのカスタム指示 | OK | GitHub Docsで、`.github/copilot-instructions.md` や `.github/instructions/**/*.instructions.md` によりレビュー用のカスタム指示を設定できることを確認。本文では方式の一例として限定的に記載。 |
| Imagen Ultraモデル | OK | Google Cloud公式ドキュメントで `imagen-4.0-ultra-generate-001` が Imagen 4 Ultra Generate のモデルIDであることを確認。画像生成スクリプトの既定モデルと一致。 |
| Optiensの事業段階・提供範囲 | OK | AGENTS.mdと `src/content/blog/_project-status.md` を確認。本文では有償案件実績や水耕栽培稼働実績を記載せず、AI活用診断・小規模業務システムの設計支援という一般表現に留めた。 |
| frontmatterと画像パス | OK | 記事slug、frontmatter `image:`、画像ファイル名を `20260516-ai-coding-refactor-technical-debt` で統一。 |

## 公開文で避ける表現

- 「AIに任せれば安全」
- 「人間のレビューは不要」
- 「必ず技術的負債を防げる」
- 「完全自動で安全に保守できる」
- 未確認のAIツール料金、プラン名、アンケート数値

## 元ソース匿名化チェック

- 済
- 確認内容:
  - 番組名、話者名、ラジオネーム、日付読み上げ、体調トーク、金額トーク、アンケート票数、宣伝要素を本文から削除。
  - 元動画の「AIコーディングレベル」「スパゲッティ/パスタ比喩」「お便りコーナー」「発音談義」「レンタルサーバー談義」の順序を使用していない。
  - 公開記事は、Optiens読者向けに「AIコーディングで作った業務システムを保守可能にする判断基準」へ再構成。
  - 元動画固有の例を、問い合わせ、見積、社内検索、レポート生成などOptiensの顧客文脈に置換。
  - 7語以上連続して文字起こしと一致しそうな特徴的表現を避けた。

## 参考元

- Martin Fowler, `Refactoring`: https://martinfowler.com/books/refactoring.html
- OWASP, `Secure Coding with AI Cheat Sheet`: https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html
- OWASP, `Top 10 2025 Next Steps`: https://owasp.org/Top10/2025/X01_2025-Next_Steps/
- GitHub Docs, `Using GitHub Copilot code review`: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review?tool=webui
- Google Cloud, `Imagen 4 Ultra Generate`: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-ultra-generate-001?hl=ja
- AGENTS.md
- `src/content/blog/_project-status.md`
