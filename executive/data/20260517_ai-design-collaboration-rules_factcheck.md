# AIデザイン時代の分業ルール ファクトチェック記録（2026-05-17）

## 対象

- 記事: `src/content/blog/20260517-ai-design-collaboration-rules.md`
- 画像: `public/images/blog/20260517-ai-design-collaboration-rules.webp`
- 文字起こし由来記事: 2026-05-17 CEO共有の文字起こし（AIデザイン / デザインシステム / 職能間協働）

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| Claude Designの位置づけ | OK | Anthropic公式発表で、Claude Designは2026-04-17発表のAnthropic Labs製品で、デザイン・プロトタイプ・スライド等を作成し、Pro/Max/Team/Enterprise向け研究プレビューと確認。本文では「方向を示している」「研究プレビュー」として断定を抑制。 |
| Claude Designのコードベース・デザインシステム連携 | OK | Anthropic公式発表とClaude公式チュートリアルで、コードベースやデザインファイルを読み込み、チームの色・タイポグラフィ・コンポーネントに沿わせる説明を確認。 |
| ui.shの説明 | OK | ui.sh公式サイトで、Claude Code / Amp / Cursor / OpenCode / Codex向けのAIコーディングエージェント用UIツールキットであり、Tailwind CSSとRefactoring UIの関係者によるものと確認。本文では価格・提供範囲・機能詳細を断定しない。 |
| WCAG 2.2 | OK | W3C公式仕様で、WCAG 2.2がWebアクセシビリティのW3C Recommendationであることを確認。本文では一般的なチェック観点として使用。 |
| Optiens社内事実 | OK | AGENTS.mdと`src/content/blog/_project-status.md`に照合。水耕栽培の実績・販売・センサーデータ稼働などの未実施事項は記載していない。AI導入支援の一般方針として記述。 |
| 強い断定表現 | OK | 「必ず成功」「完全」「誰でもすぐ」等の強い成果保証は不使用。AIデザインの限界と人間レビューの必要性を明記。 |
| 元ソース匿名化 | OK | 番組名・話者名・お便り形式・雑談・固有比喩・料金トーク・Heroku話題を削除。構成は「課題→ルール→協働→Optiens視点」に再構成済み。 |
| 画像 | OK | `imagen-4.0-ultra-generate-001`で生成。記事slugと画像slugが一致。表示確認対象はテキスト・ロゴ・数字なし。 |

## 公開文で避ける表現

- 「AIでデザイナーが不要になる」
- 「AIだけで本番品質のUIが作れる」
- 「誰でもすぐにプロ並みのデザインができる」
- 「Claude Design / ui.sh を使えば確実に品質が上がる」

## 元ソース匿名化チェック

- 済
- 確認内容: 動画タイトル・話者名・番組名・お便り形式・元動画固有の雑談・宣伝CTAを削除。記事構成は元の会話順をなぞらず、Optiens読者向けの導入判断・分業ルールとして再構成。

## 参照元

- Anthropic: https://www.anthropic.com/news/claude-design-anthropic-labs
- Claude: https://claude.com/resources/tutorials/using-claude-design-for-prototypes-and-ux
- ui.sh: https://ui.sh/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Google Cloud Imagen 4 Ultra model: https://cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-ultra-generate-001
