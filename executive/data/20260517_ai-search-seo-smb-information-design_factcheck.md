# AI検索時代のSEO：中小企業がAI回答に選ばれるための情報設計 ファクトチェック記録（2026-05-17）

## 対象

- `src/content/blog/20260517-ai-search-seo-smb-information-design.md`
- アイキャッチ画像: `public/images/blog/20260517-ai-search-seo-smb-information-design.webp`

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| Google検索にAI Overviews / AI Modeが存在する | OK | Google Search Centralが、AI OverviewsとAI ModeをGoogle SearchのAI機能として説明している。 |
| AI機能への表示に特別なAI専用マークアップは不要 | OK | Google Search Centralは「追加の技術要件なし」「新しいAIテキストファイルや特別なschema.orgは不要」と説明している。記事では断定範囲をGoogle検索に限定した。 |
| 基礎SEO、クロール可能性、テキスト本文、内部リンク、ページ体験が重要 | OK | Google公式ガイドで、従来のSEOベストプラクティスが引き続き有効であること、クロール可能性・技術構造・ページ体験が重要であることを確認。 |
| AI検索でリンクの表示・プレビューが強化されている | OK | Google公式ブログ（2026-05-06）で、AI Mode / AI Overviewsにおける関連リンク、オンライン議論のプレビュー、文中リンク、リンク先プレビュー強化を確認。記事では米国・英語などの展開条件に踏み込まず、方向性として扱った。 |
| AEO/GEOという用語 | OK | Google公式ガイドがAEO/GEOに触れた上で、Google検索の観点では生成AI検索への最適化もSEOの一部と説明している。 |
| AI向けの小分けページ量産・AI専用ファイル・AIだけを意識した書き換えを避ける | OK | Google公式ガイドが、chunking、AI text files、AIだけを意識した書き換え、authenticでないmentionsへの過剰注力を不要または不適切な方向として説明している。 |
| OptiensのAI支援事業との整合 | OK | AGENTS.md上のAI支援事業方針（無料レポート、詳細レポート、導入支援、保守）と矛盾しない一般表現に留めた。価格やMTG有無の詳細は本文では断定せず、サービス導線の整理という一般論で記述。 |
| 禁止事項との整合 | OK | 宇宙、旧ターゲット、家庭用ガーデニング、個人向けEC、旧グリーン系ブランド表現などは本文に含めていない。 |
| 元ソース匿名化 | OK | 元動画名、話者名、チャンネル名、イベント名、宣伝、話順、特有の比喩や言い回しを削除。公開記事はGoogle公式情報とOptiensの視点に再構成した。 |

## 公開文で避けた表現

- 「AI検索で必ず表示される」
- 「AEO/GEOだけで上位に出せる」
- 「GoogleのAI機能は日本で全機能利用できる」
- 文字起こし内の未確認の製品名、料金、利用枠、提携、GPU規模、モデル性能比較

## 作成後チェック

- 記事本文は文字起こしの順序・固有例・宣伝要素を引き継いでいない。
- アイキャッチ画像は文字・ロゴ・固有サービス名を含まない抽象的な業務/AI検索イメージとして生成する。
- 画像生成モデルは `scripts/generate-blog-imagen.mjs` の既定 `imagen-4.0-ultra-generate-001` を使用する。

## 参照元

- Google Search Central: AI features and your website
  https://developers.google.com/search/docs/appearance/ai-features
- Google Search Central: Optimizing your website for generative AI features on Google Search
  https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google: 5 new ways to explore the web with generative AI in Search
  https://blog.google/products-and-platforms/products/search/explore-web-generative-ai-search/
- AGENTS.md（Optiens社内正本、AI支援事業方針・禁止事項）
