# ブログ記事パイプライン運用ガイド

中小事業者向けのコンテンツマーケティング戦略として、案 B（10〜15 本/日相当のスケール、品質維持）を持続可能にするための標準ワークフロー。

## 設計原則

- **品質ファースト**: 出典明記・ファクトチェックは省略しない。スケールで品質を犠牲にしない
- **テンプレート駆動**: 4 型に絞ることで執筆速度・品質均質化・読者の認知負荷を最適化
- **並列処理**: 5 本/バッチで researcher 並列実行（API レート制限を考慮）
- **公開時系列分散**: 一気に公開せず、未来日設定で 1 日 5〜15 本ずつ自然公開
- **重複ゼロ運用**: 執筆前に必ず重複チェック、既存記事との角度差別化を冒頭で明示

## 記事ソース

| ソース | 用途 | 頻度 |
|---|---|---|
| 動画文字起こし | ユーザーから受領した動画の有用箇所を Optiens トーンで再構成 | ユーザー稼働ペース |
| リサーチ | 文字起こしソースが切れた時、業界調査・公式リリースから記事化 | 補完的 |
| 自社運用知見 | Imagen 4 Ultra 運用・水耕栽培・経営オペレーションの実例 | 月次 |

## 標準ワークフロー（記事 1 本あたり）

### Step 1: テーマ確定 + 重複チェック
```bash
node scripts/blog/check-duplicates.mjs "キーワード1" "キーワード2" "キーワード3"
```
- 既存記事のヒット結果を確認
- 重複リスクが高い場合は角度を再設計
- 重複なし or 差別化方針が明確 → Step 2 へ

### Step 2: テンプレート選定
4 つの型から最適なものを選ぶ：
| 型 | テンプレート | 適する内容 |
|---|---|---|
| 比較系 | `.claude/templates/blog/comparison.md` | 「A vs B」「3 社比較」「N 選」 |
| チェックリスト系 | `.claude/templates/blog/checklist.md` | 「N 項目」「N の落とし穴」「導入手順」 |
| 事例集系 | `.claude/templates/blog/case-study.md` | 「N 大事故」「失敗事例」「成功パターン」 |
| 解説系 | `.claude/templates/blog/explainer.md` | 「とは何か」「なぜ起きるか」「どう設計するか」 |

### Step 3: 執筆
- ドラフト先: `src/content/blog/_drafts/<slug>.md`（アンダースコア prefix で Content Collection から除外）
- frontmatter:
  - `title`, `date`, `category`, `excerpt`, `image`
  - `draft: true`（未公開明示）
  - 公開準備が整ったら `draft: false` に切り替え + `_drafts/` から `src/content/blog/` へ移動
- 執筆規約:
  - 出典は本文中に URL 直書き or 末尾に集約（必須）
  - 数値・固有名詞は一次情報源 URL を併記
  - 「現場ヒアリングベース」等は明示
  - 関連記事リンクは末尾に 2〜4 本

### Step 4: 画像生成（5 本溜まったらバッチ）
```bash
node scripts/blog/generate-images-batch.mjs path/to/batch.json
```
- `batch.json` 形式: `[{slug, prompt}, ...]`
- 出力: `public/images/blog/<slug>.webp`
- ファイル名は記事 slug と完全一致必須

### Step 5: ファクトチェック（5 並列）
```bash
node scripts/blog/run-factcheck.mjs <slug1> <slug2> ... <slug5>
```
- researcher エージェントを 5 並列で起動
- Critical 修正項目は必ず適用
- Important / Minor は記事の重要度に応じて判断
- 検証時間目安: 5 並列で 5〜10 分

### Step 6: 修正反映
- ファクトチェック結果の Critical 項目を Edit ツールで反映
- 出典 URL の追加・更新
- 数値の修正

### Step 7: 公開時系列分散
- `src/content/blog/_drafts/<slug>.md` → `src/content/blog/<slug>.md` へ移動
- frontmatter の `date` を未来日（例: 5 日後の YYYY-MM-DD）に設定
- `draft: false` に変更
- 1 日あたり最大 15 本の date が重ならないよう調整

### Step 8: コミット・プッシュ
- 1 バッチ（5 本）を 1 コミットにまとめる
- コミットメッセージ: `feat: ブログ N 本追加（型・テーマ概要）`
- push 後、Vercel が自動デプロイ
- 公開日に到達した記事のみ表示される（getCollection でフィルタ）

## 並列処理の上限

| 処理 | 並列数 | 理由 |
|---|---|---|
| 記事執筆 | 1（順次） | Write ツールは順次、品質維持のため並列しない |
| 画像生成 | 1 batch script 内で順次 | Vertex AI クォータ保護 |
| ファクトチェック | 5 並列まで | researcher エージェントの実用上限 |
| Edit 修正 | 並列可（異なるファイル） | 同一ファイル並列は禁止 |

## 公開ペースの目安

| ユーザー稼働 | 想定本数/週 | 想定本数/月 |
|---|---|---|
| 動画文字起こし 1 本/日 | 5〜10 本 | 20〜40 本 |
| 動画文字起こし 3 本/日 | 15〜25 本 | 60〜100 本 |
| 文字起こしなし（リサーチのみ） | 3〜5 本 | 12〜20 本 |

## 重複チェック必須項目

執筆前に以下のキーワードで grep：
- 主要固有名詞（製品名・サービス名・機能名）
- 数値（金額・割合・件数）
- 概念タイトル（「N の落とし穴」「3 つの判断軸」等）

## ファクトチェック簡素化ガイド

### 必須検証項目（全記事）
- 数値（金額・割合・件数）は一次情報源で確認
- 固有名詞・サービス名・機能名の正式表記
- リリース日・バージョン番号
- 公式 URL の到達確認

### スポット検証項目（重要度高い記事のみ）
- 競合製品・サービスとの比較精度
- 業界統計の出典妥当性
- セキュリティ事故事例の事実関係

### 検証不要（明示的に軽量化）
- 「現場ヒアリングベース」と注釈済みの体感値
- 一般論・通説の範囲内の記述
- Optiens 自社運用知見

## トラブル時の対応

| 症状 | 対応 |
|---|---|
| Vertex AI クォータ到達 | `generate-blog-imagen.mjs` を 1 枚ずつ実行 |
| researcher エージェント timeout | 並列数を 3 に下げて再実行 |
| ファクトチェックで Critical 多数発覚 | バッチ全体を再執筆検討 |
| 公開後に重大な誤り発覚 | Edit で修正 → コミット → push（即時反映） |

## 関連ファイル

- テンプレート: `.claude/templates/blog/`
- スクリプト: `scripts/blog/`
- 既存ブログ運用ルール: `feedback_blog-workflow.md`
- ファクトチェック方針: `feedback_blog-factcheck-mandatory.md`
- 画像パス命名: `feedback_blog-image-path-naming.md`
- 文字起こしからの書き直しルール: `feedback_blog-rewrite-from-transcript.md`
