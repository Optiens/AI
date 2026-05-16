# 小さなAIアプリのDB選定 ファクトチェック記録（2026-05-16）

## 対象

- `src/content/blog/20260516-cheap-database-d1-turso-sqlite.md`
- `public/images/blog/20260516-cheap-database-d1-turso-sqlite.webp`
- 文字起こし由来の社内ナレッジ:
  - `executive/data/transcript-insights/20260516_reference_cheap_database_d1_turso_sqlite.md`

## 判定

- 修正後公開可
- 文字起こしは事実源として扱わず、料金・制限・機能は公式情報で確認した。

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| Cloudflare D1はSQLiteベースのサーバーレスSQL DB | OK | Cloudflare D1公式ドキュメントで、WorkersからSQL DBをクエリでき、SQLiteベースである旨を確認。 |
| Cloudflare D1の料金・制限 | 要修正後OK | Workers pricingとD1 limitsを確認。Workers Paidは月額課金枠があり、D1 limitsではPaidで最大50,000 DB、DB最大10GB。本文では「2026年5月16日時点」「公式情報では」と限定した。 |
| Tursoの料金・DB数 | 要修正後OK | Turso公式PricingでFreeは100 DB、Developerは$5.99/月から、DeveloperのDB数はUnlimitedと確認。文字起こし内の「月5ドル」断定はそのまま使わず、公式価格に修正。 |
| TursoとSQLite | OK | Turso公式ドキュメントでSQLiteのプラットフォームとして説明されていることを確認。 |
| Turso Multi-DB Schemas | 要注意 | 公式PricingでMulti-DB SchemasがDeprecated for new usersと表示されていることを確認。本文ではTurso固有のMulti-DB Schemasを推奨せず、顧客ごとにDBを分ける設計は一般論として扱った。 |
| SQLiteの特徴 | OK | SQLite公式Aboutで、serverless, zero-configuration, self-contained SQL database engine と確認。本文は「サーバーレスで設定不要、自己完結型」と表現。 |
| SQLiteの型の厳密性 | 要修正後OK | SQLite STRICT Tables公式ページで、通常のSQLiteは柔軟な型付け、STRICTテーブルでより厳密な型強制が可能と確認。本文では「Postgresとは考え方が違う」と弱めた。 |
| Optiensの事業段階・提供範囲 | OK | AGENTS.mdと `src/content/blog/_project-status.md` を確認。AI支援事業の軽量PoC・設計支援として記述し、水耕栽培の未稼働実績や架空売上は記載していない。 |
| frontmatterと画像パス | OK | 記事slug、frontmatter `image:`、画像ファイル名を `20260516-cheap-database-d1-turso-sqlite` で統一。 |
| アイキャッチ画像生成 | OK | Google公式ドキュメントで Imagen 4 Ultra のモデルID `imagen-4.0-ultra-generate-001` を確認し、同モデルで `public/images/blog/20260516-cheap-database-d1-turso-sqlite.webp` を生成。画像内に読み取れる文字・ロゴ・数字がないことを目視確認。 |

## 公開文で避ける表現

- 「D1/Tursoなら無制限に無料で使える」
- 「Supabaseは高すぎる」
- 「SQLiteは本番で常に問題ない」
- 「シングルテナントなら権限問題が完全に解決する」
- 料金・制限の断定（公式価格は変わるため日付付きで扱う）

## 元ソース匿名化チェック

- 済
- 確認内容:
  - 動画タイトル、チャンネル名、話者名、ラジオネーム、日付読み上げ、雑談、発音談義、宣伝要素を本文から削除。
  - 元動画の「GW雑談 → 格安DB → D1/Turso → 発音談義 → お便り」の順序は使っていない。
  - 公開記事は、Optiens読者向けに「AI時代の小規模アプリでDB固定費と運用設計をどう見るか」へ再構成。
  - 元動画固有の表現や比喩を避け、問い合わせ管理、簡易CRM、AI診断、社内ツールなどOptiens顧客文脈に置換。
  - 公式確認できる内容のみ事実として残し、文字起こし由来の料金断定は修正した。

## 参照元

- Cloudflare D1 documentation: https://developers.cloudflare.com/d1/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- Turso pricing: https://turso.tech/pricing?frequency=monthly
- Turso documentation: https://docs.turso.tech/introduction
- SQLite About: https://sqlite.org/about.html
- SQLite STRICT Tables: https://sqlite.org/stricttables.html
- Google Cloud Imagen 4 Ultra Generate: https://cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-ultra-generate-001
- AGENTS.md
- `src/content/blog/_project-status.md`
