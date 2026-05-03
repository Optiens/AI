# Optiens サイト進捗・引き継ぎ資料

- **最終更新**: 2026-05-02
- **対象**: optiens.com（Astro 5 + Vercel SSR）
- **目的**: Code side（後続セッション・他のエンジニア）が現在のサイト状態と未決事項を即座に把握するための引き継ぎ資料

---

## 1. プロジェクト全体像

### 事業ポジショニング
- AI支援事業（最優先・収益本柱）と 室内IoT水耕栽培事業（長期・実証フェーズ）の2軸
- 全国の中小企業・小規模事業者向け（大企業ではない・地域限定でもない）
- 代表1名の合同会社。将来パートナー追加を見据えた構造で実装

### 主要ページ
| URL | 役割 | 状態 |
|---|---|---|
| `/` (HOME) | 事業紹介の入口、AI支援事業のCTA中心 | 完成・純白統一済み |
| `/service` | AI支援事業のサービス詳細・FAQ | 完成・コンサルタントカード化済み |
| `/service/sample-executive` | 経営者向けAIブリーフィングのサンプル | 完成 |
| `/service/sample-{industry}` | 業種別11業種のサンプルレポート | 既存 |
| `/ai-examples` | 活用事例集（マスター・ディテール構造） | 完成・直近再設計 |
| `/consultants/takahashi-daichi` | 担当コンサルタントの詳細プロフィール | 完成・新設 |
| `/about` | 会社概要・代表プロフィール・価値観 | 完成 |
| `/studio` | サイドプロジェクトStudio Optiens | 完成（/aboutから導線） |
| `/hydroponics` | 水耕栽培事業の紹介＋関連ブログ | 完成・動的ブログリスト化済み |
| `/hydroponics/<slug>` | 水耕栽培ブログ記事 | 完成・/blogから301移動済み |
| `/blog` | AI・ビジネス系ブログ一覧 | 完成（水耕系を除外） |
| `/contact` | 問い合わせフォーム | 完成 |
| `/free-diagnosis` | 無料活用診断申込フォーム（予算項目あり） | 完成 |
| `/document-editor` | 書類添削AIデモ | 既存 |
| `/novel-review` | 小説推敲ツール（Studio用・スマホ可） | 既存 |

### ナビゲーション構造（ヘッダー）
日本語化済み: サービス / 活用事例 / 会社情報 / ブログ / お問い合わせ
（STUDIOはナビから外し、/about経由のみのアクセス）

---

## 2. 設計コンベンション

### ビジュアル基調
- **背景**: 全ページ純白（#ffffff）統一。グラデーションやダーク背景は基本使わない（/studioのみ例外）
- **ヒーロー**: 主要ページは100vh（min-height: 100vh / 100dvh）+ ParticleCanvas
- **ブランドグラデーション**: `linear-gradient(135deg, #A259FF 0%, #1ABCFE 100%)` （紫→青）
- **CTA**: ピル型（border-radius: 999px）+ ブランドグラデ + box-shadow
- **タイポ**: 見出しは句点（。）で締める。「！」は使わない

### グローバルCSS（src/styles/global.css）
- `.btn-primary` はサイト全体でグラデーションピル統一済み
- `.btn-secondary` は白地+紫枠線（個別ページでスタイル定義）

### コピー方針
- 「御社」を多用しない（重複は削除する）
- 専門用語は「比喩 + 補足」方式で説明する
  - SaaS = 賃貸住宅 / 専用構成 = 注文住宅
  - ベンダーロックイン = 退去するとデータが持ち出せない状態
  - クラウドDB = 御社名義のデータ保管庫
- `<small>` タグで業界用語を補足する（例: `市販の業務システム<small>(業界用語で「SaaS」)</small>`）

### 価格開示ルール
- `/service` では段階別の概念のみ提示（具体額は出さない）
- `/service/sample-executive` のみ「ランニングコスト目安: 月数千〜数万円」を許可
- 詳細価格は無料診断レポートで個別試算

---

## 3. 実施済みの主要変更（直近）

### サイト構造の再編
- HOMEとABOUTを分離
- Studio Optiensページ新設（kakuyomu連携）
- Studio・水耕栽培事業をサイドプロジェクトとして明確化
- 全ヒーローを100vh化、純白背景統一

### SEO基盤
- `public/sitemap.xml` `public/robots.txt` 整備
- `Layout.astro` にJSON-LD（Organization + ProfessionalService + WebSite）
- og:image デフォルト1200×630生成（Pillow + Noto Sans JP）
- Title/Description にキーワード強化
- Organization schema の sameAs に kakuyomu URL追加

### コンテンツ
- ブログ記事追加: 4/29 AI業務判断フレームワーク / 5/1 経営者向けAIブリーフィング3領域
- 全ブログ記事の category タグを再整備
- 水耕栽培系記事を `/hydroponics/<slug>` へ完全移行（301リダイレクト設定済み）

### `/service` の磨き込み
- ヒーロー: 「定型業務の9割を自動化。判断と創造に集中できる経営へ。」
- WHY AI 3カード（短い見出しで再構成）
- サービスメニューを STEP 1-3 + 別領域 WORKSHOP の3+1構成に
- 「業務に合わせた、専用の仕組み」セクションを賃貸/注文住宅の比喩で書き直し
- 「Optiensが選ばれる理由」を「担当コンサルタント」セクションに置換（コンパクトカード+詳細ページへリンク）
- FAQ を 7→3項目にスリム化（用語解説/セキュリティ/契約期間）
- WORKSHOPカードを 入門/上位 の2階層化（ただし価格は未確定・後述）

### `/ai-examples` 再設計（直近）
- 18事例（共通6+業種11+役職1）を上から下へ羅列する形から、**マスター・ディテール構造**に変更
- カテゴリタブ → セレクタリスト → 詳細パネルの3層
- frontmatter にデータを型定義+配列で保持。将来の事例追加は配列に1行追加するだけ
- URLハッシュで状態保持（`/ai-examples#case-01` 等）
- モバイル時はクリックで詳細パネルへ自動スクロール

### コンサルタント機能の新設
- `/service` のコンサルタントカードはコンパクトな1行カード（avatar+name+role+arrow）
- クリックで `/consultants/takahashi-daichi` へ遷移
- 詳細ページは Hero+経歴+3つの強み+アプローチ+対応領域+CTA で構成
- 将来パートナーが増えたら `/consultants/<slug>.astro` を追加するだけ

### グローバルボタン統一
- `src/styles/global.css` の `.btn-primary` をフラット紫 → グラデーションピルに変更
- 「事例集を見る」など全ページの主要CTAが自動的に統一されるように

---

## 4. 未決事項（Decision Pending）

### 【重要】ワークショップの価格・無料化方針
**現状**: `/service` のWORKSHOPカードは「無料」と表示（前回CEOが「無料が大前提」と指示したため）。
**論点**: CEO一人の状況で完全無料の2時間ワークショップは時間消耗が大きく、持続不能ではないかという疑問が出ている。

**提案した3案**:
- **案A**: 両階層とも有料に戻す（入門 ¥30,000 / 上位 ¥80,000）
- **案B**: 入門は商工会・自治体・補助金事業の枠内のみ無料、それ以外は有料（推奨）
- **案C**: 完全有料化（入門 ¥40,000 / 上位 ¥100,000）、無料は活用診断レポートに一本化

**CEOの判断待ち**。決定後、`/service` のWORKSHOPカード表記と `executive/research/data/20260501_ワークショップ設計メモ.md` を同時更新する必要あり。

---

## 5. 残タスク・将来の改善余地

### 短期（次回セッション候補）
- ワークショップ価格決定後の表記・メモ反映
- ボタングラデ統一後の各ページ目視確認（Final CTA・examples-banner-btn等）
- `/ai-examples` の新レイアウトをスマホ実機で動作確認（特にスクロール挙動）

### 中期
- コンサルタントが増えた場合の `/consultants/index.astro` 一覧ページ新設
- 業種別11サンプルページの整合性チェック（コピー・数値・新方針反映）
- ワークショップの実績・事例ができた時点で「過去の開催事例」セクションを `/service` に追加
- 商工会・商工会議所への入門ワークショップ持ち込み打診

### 長期
- 小規模事業者向け語彙の更なる洗練（必要に応じて）
- AI支援事業の受注実績蓄積後、HOMEに「導入実績」セクション新設

---

## 6. 重要なファイル参照

### サイト本体
- `src/layouts/Layout.astro` — 全ページ共通レイアウト・JSON-LD
- `src/components/Header.astro` — ナビゲーション（日本語化済み）
- `src/components/Footer.astro` — 純白フッター
- `src/components/ParticleCanvas.astro` — ヒーローのパーティクルアニメ
- `src/styles/global.css` — グローバルCSS・btn-primary（グラデピル統一）
- `src/content/blog/` — Astro Content Collections のブログソース

### 戦略・設計メモ
- `CLAUDE.md` — 事業方針・禁止事項・ロードマップ・COO体制
- `executive/research/data/20260501_ワークショップ設計メモ.md` — 入門/上位カリキュラム
- `executive/research/data/20260501_AI支援事業_価格戦略メモ.md` — 価格戦略
- `executive/research/data/20260501_AI経営自動化_秋吉氏動画知見.md` — 外部知見の社内化

### スクリプト
- `scripts/sync-novels.mjs` — 小説ソース → public/novels/ の同期（ビルド時自動実行）

---

## 7. デプロイ・運用

- ビルドコマンド: `npm run build`（内部で `node scripts/sync-novels.mjs && astro build`）
- ホスト: Vercel hnd1
- Supabase: 小説推敲ツール用に `novel_review_notes` テーブル
- 月次定期チェック: `/check-deadlines` Skill + 1日のサイト整合性チェック

---

## 8. 行動規範（重要）

CEOからの指示はすべて **ドミトリー・コズロフ（COO）** 経由で処理する。
詳細は `CLAUDE.md` の「COO経由ワークフロー（必須）」参照。

委譲先:
- 開発・コード → ヴィクトル・グロモフ（CTO）
- ドキュメント・コピー → アンナ・レベデワ（CMO）
- 戦略整合・PM → タチアーナ・スミルノワ（CSO）
- 市場調査 → アレクセイ・モロゾフ（CRO）
- 財務・補助金 → セルゲイ・ペトロフ（CFO）

不可逆操作（削除・push）は必ずCEO確認を取る。
