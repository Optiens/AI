# ホームページOG画像・LINEカード向けメタ情報 ファクトチェック記録（2026-05-16）

## 対象
- `src/layouts/Layout.astro`
- `src/pages/index.astro`
- `public/images/og-home-firstview-20260516.png`

## 判定
- 修正後公開可

## 確認結果

| 項目 | 判定 | 根拠・修正方針 |
|---|---|---|
| ホームページ専用OG画像 | OK | 1200×630pxのPNGとして作成。HOMEファーストビューのブランドトーンを優先し、LINEやSNSの大きいリンクカードでも同じ印象で表示されるよう新規ファイル名で参照 |
| OGタイトル・説明文 | OK | SEO用の通常title/descriptionは維持し、SNSカード用に短い `ogTitle` / `ogDescription` を追加。内容はAI業務自動化、AI活用診断、導入・保守、CRM・問い合わせ・見積・営業事務に限定 |
| OGPメタタグ | OK | `og:image` に加えて `og:image:secure_url`、`og:image:width`、`og:image:height`、`og:image:type`、`twitter:image:alt` を追加 |
| キャッシュ対策 | OK | 既存 `og-default.png` と同じHOMEファーストビュー画像を、`og-home-firstview-20260516.png` の新規ファイル名で参照し、SNS側の画像キャッシュ更新を促す構成にした |
| 禁止事項との整合 | OK | SaaS外部販売、宇宙、医療機関、防災拠点、家庭用ガーデニング等の禁止領域には触れていない |

## 公開文で避けた表現
- 必ず表示が変わる
- LINE側キャッシュが即時削除される
- 完全自動化
- SaaS販売

## 参照元
- `AGENTS.md`
- `src/layouts/Layout.astro`
- `src/pages/index.astro`
- `public/images/og-home-firstview-20260516.png`

## 追加対応（2026-05-16）
- LINEのリンクプレビューはURL単位でキャッシュされるため、`https://optiens.com/` の既存キャッシュは即時に更新されない可能性がある。
- `?v=...` 付きURLで確認した場合も、`og:url` が常に `https://optiens.com/` だと同一URL扱いになりやすいため、HOMEのみクエリ付きアクセス時は `og:url` もクエリ付きURLにする。
- `canonical` は引き続き `https://optiens.com/` のままとし、SEO上の正規URLは変更しない。
