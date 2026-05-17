# 圏論は実務に役立つのか：AI時代のプログラマーが抽象化を学ぶ意味 ファクトチェック記録（2026-05-17）

## 対象

- `src/content/blog/20260517-category-theory-abstraction-programmers.md`
- `public/images/blog/20260517-category-theory-abstraction-programmers.webp`

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| 圏論は対象・射・合成・恒等射・結合律を扱う | OK | Stanford Encyclopedia of Philosophy が、morphism、identity、composition と associativity/identity axioms を説明している。 |
| 圏論では対象より射・写像・関係を重視する見方がある | OK | Stanford Encyclopedia of Philosophy は、Eilenberg & Mac Lane の説明として objects は secondary role と紹介している。記事では実務向けに弱めて表現した。 |
| Haskell のモナド用語は圏論のモナド構成に由来する | OK | Haskell公式チュートリアルが monadic classes are based on the monad construct in category theory と説明している。 |
| 圏論を知るだけで業務成果が即向上するわけではない | OK | これは外部事実ではなく記事上の評価。断定しすぎないよう「わけではありません」「必須スキルではありません」とした。 |
| OptiensのAI導入支援への接続 | OK | AGENTS.md の AI支援事業方針と矛盾なし。導入実績・受注実績を示す表現は使っていない。 |
| 水耕栽培・旧方針禁止事項 | OK | 宇宙、医療、防災、個人向けEC、旧グリーン系事業方針などの禁止事項に触れていない。 |
| アイキャッチ画像 | OK | frontmatter の `image` と出力パスが一致している。`imagen-4.0-ultra-generate-001` で生成し、画像ファイルの存在と文字・ロゴがないことを目視確認した。 |
| 画像生成モデル | OK | Google Cloud 公式ドキュメントで Imagen 4 Ultra Generate のモデル ID が `imagen-4.0-ultra-generate-001` であることを確認した。 |

## 公開文で避ける表現

- 「圏論を学べば設計力が上がる」
- 「圏論は実務で必須」
- 「AI導入は圏論で解決できる」
- 文字起こし元の対談表現、話者名、固有例、冗談調の断定

## 元ソース匿名化チェック（文字起こし由来）

- 済
- 確認内容:
  - 動画タイトル、話者名、チャンネル名、対談の口調、宣伝CTAを本文に残していない。
  - 元の説明順序（歴史紹介 → 定義 → クイズ → 人間関係例 → モノイド）をなぞらず、実務上の抽象化に再構成した。
  - 猫、個人名、対談中の比喩、特徴的な一文を使っていない。
  - 文字起こしは事実源として扱わず、数学的定義とHaskell関連の事実は外部情報で確認した。

## 参照元

- Stanford Encyclopedia of Philosophy: Category Theory
  https://plato.sydney.edu.au/entries/category-theory/
- cattheory.org: I.1. Categories
  https://cattheory.org/sections/1_computation/01_categories.html
- A Gentle Introduction to Haskell: About Monads
  https://www.haskell.org/tutorial/monads.html
- Google Cloud: Imagen 4 Ultra Generate
  https://cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-ultra-generate-001
- AGENTS.md（Optiens社内正本、AI支援事業方針・禁止事項）
