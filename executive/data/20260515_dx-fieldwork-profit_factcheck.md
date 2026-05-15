# DX現場実行プロセス記事 ファクトチェック記録（2026-05-15）

## 対象

- `src/content/blog/20260515-dx-fieldwork-profit.md`
- CEO共有の文字起こしをもとに、Optiens向けに再構成したブログ記事。

## 判定

- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| DXは単なるIT化ではなく、業務・組織・文化・ビジネスモデルを変革し競争上の優位性につなげる取り組みである | OK | 経済産業省「デジタルガバナンス・コード3.0」では、DXをデータとデジタル技術を活用し、製品・サービス・ビジネスモデル、業務・組織・プロセス・企業文化を変革し、競争上の優位性を確立することと定義している。 |
| DXは経営者の関与が重要である | OK | 経済産業省資料で、DX推進はIT部門だけでなく経営陣・取締役会の役割として捉える必要がある旨が示されている。記事では「経営課題として扱う」と表現した。 |
| デジタイゼーション、デジタライゼーション、DXは段階として区別できる | OK | IPAのDX推進に関する資料では、アナログ・物理データのデジタル化、業務効率化や既存サービス高付加価値化、デジタルトランスフォーメーションを段階的に整理している。 |
| 「生成AIを入れればDXになる」 | 削除 | 公式定義と整合しない。記事では、AIやRPAは目的達成の手段であり、投資対効果と業務定着で判断する表現にした。 |
| 現場ヒアリングだけで課題抽出すればよい | 要修正 | 文字起こし由来の主張であり、一般事実ではなく実務上の観点として扱う。記事では「ヒアリングに加え、実作業・入力項目・例外処理まで確認する」と弱めた。 |
| 10万円の課題に100万円のシステムを作らない | OK（意見） | 数値は例示であり、外部統計ではない。記事では「小さな課題に過大な仕組みを作らない」という投資対効果の考え方として記述。 |
| 特定プロジェクトの農業物流事例 | 削除 | 元動画固有の事例で出典特定につながるため、公開記事では使わない。請求書、見積、在庫、問い合わせなど一般化した業務例へ置換した。 |
| 画像生成モデルは Imagen Ultra 最新安定版を使う | OK | Google Cloud公式の Imagen 4 ドキュメントで `imagen-4.0-ultra-generate-001` を確認。 |
| frontmatter と画像パスの整合性 | OK | 記事 `image` は `/images/blog/20260515-dx-fieldwork-profit.webp`。実ファイル `public/images/blog/20260515-dx-fieldwork-profit.webp` の存在を確認。 |

## 公開文で避ける表現

- 「必ず成功する」
- 「現場は理屈では動かない」といった過度な断定
- 「生成AIを入れない企業は負ける」などの煽り
- 元動画の会社名、話者名、チャンネル名、特定アプリ名、具体プロジェクト名
- 公式定義とずれる「DX=儲けることだけ」という単純化

## 元ソース匿名化チェック（文字起こし由来）

- 判定: 済
- 確認内容:
  - 動画タイトル・話者名・会社名・チャンネル名・宣伝CTAは本文に記載しない。
  - 元動画の固有事例は採用せず、Optiens読者向けに請求書、見積、在庫、問い合わせ対応へ置き換えた。
  - 構成は「失敗の原因 → 5ステップ → 失敗パターン → Optiensでの適用」に再構成した。
  - 感情的・煽り気味の表現は、投資対効果・現場定着・業務分解の実務表現に変換した。

## 参照元

- 経済産業省 デジタルガバナンス・コード: https://www.meti.go.jp/policy/it_policy/investment/dgc/dgc.html
- デジタルガバナンス・コード3.0 PDF: https://www.meti.go.jp/shingikai/mono_info_service/digital_gv_corp_values/pdf/004_04_00.pdf
- IPA デジタルトランスフォーメーション（DX）: https://www.ipa.go.jp/digital/dx/index.html
- IPA DX推進の段階毎の企業の課題と考察: https://www.ipa.go.jp/digital/chousa/discussion-paper/dxwp2023-bestpractice.html
- Imagen 4 / Vertex AI documentation: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate

## 公開前検証

- `rg` により、公開記事本文に元動画の話者名、会社名、固有プロジェクト名、宣伝CTAが残っていないことを確認。
- `public/images/blog/20260515-dx-fieldwork-profit.webp` の存在を確認。
- `npx astro sync` 実行済み。
- `npm run build` は `/blog/20260515-dx-fieldwork-profit/` の prerender まで到達したが、最後の Vercel adapter 依存コピーでローカル環境側の `ENOENT` が発生。記事本文・frontmatter・画像パス由来のエラーではない。
