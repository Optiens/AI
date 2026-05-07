---
name: GCP セットアップ手順書 — 無料診断 Slides 自動化
date: 2026-05-07
status: CEO作業用（参考: 私=Claude が代行不可な部分）
owner: CEO
estimated_time: 約 30〜45 分（GCP操作） + 2〜3 時間（Slidesテンプレ手動作成）
---

# GCP セットアップ手順書

## 全体フロー

```
[CEO作業]
  1. GCPプロジェクト作成
  2. Slides API + Drive API 有効化
  3. Service Account 作成 + JSONキー発行
  4. Slidesテンプレ手動作成
  5. テンプレをService Accountに共有
  6. .env に環境変数追加
        ↓
[Claude作業（並行）]
  - Edge Function コード実装
  - 競合対策実装
  - テストスクリプト準備
```

---

## Step 1: GCP プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にログイン（個人/法人いずれでも可）
2. 上部のプロジェクト選択 → **「新しいプロジェクト」**
3. プロジェクト名: `optiens-slides-automation`（任意）
4. 組織: なし（個人なら）/ Optiens（法人GCP組織あれば）
5. **作成**

> ⚠️ 既存のプロジェクト（例: optiens-website 等）があればそれを使ってもOK

---

## Step 2: API 有効化

1. プロジェクト選択後、左メニュー → **「APIとサービス」** → **「ライブラリ」**
2. 以下の2つのAPIを検索 → それぞれ **「有効にする」** をクリック:
   - **Google Slides API**
   - **Google Drive API**

> ⚠️ 課金アカウントが必要なケースあり。月数千円の上限設定を **Step 7** で行います

---

## Step 3: Service Account 作成

1. 左メニュー → **「IAMと管理」** → **「サービスアカウント」**
2. **「サービスアカウントを作成」**
3. 名称: `optiens-slides-automation`
4. 説明: `無料診断レポート Slides 自動生成用`
5. **作成して続行**
6. ロール（権限）: なし（**Slides/Drive APIへのアクセスはAPI側で十分、ロール付与不要**）
7. **完了**

### Service Account のメールアドレスをメモ
- 作成完了画面に表示される `optiens-slides-automation@xxx.iam.gserviceaccount.com` の形式
- このメールアドレスは **Step 5** で必要

---

## Step 4: JSONキー発行

1. 作成した Service Account の行をクリック
2. 上部タブ **「キー」** を開く
3. **「鍵を追加」** → **「新しい鍵を作成」**
4. キーのタイプ: **JSON**
5. **作成** → JSON ファイルが自動ダウンロードされる
6. ファイル名例: `optiens-slides-automation-xxxxxxxx.json`

### ⚠️ セキュリティ注意
- このファイルは **絶対に Git にコミットしない**
- `.env` 経由で参照する（後述）
- GitHub に誤って push した場合は即座にキー失効・再発行

---

## Step 5: Slides テンプレ手動作成

仕様書: `executive/ai-consulting/無料診断Slidesテンプレ仕様.md` v1.0 を参照

### 作業手順
1. [Google Slides](https://slides.google.com/) で新規プレゼンテーション作成
2. ファイル名: `Optiens 無料AI活用診断レポート テンプレ v1.0`
3. 仕様書の **11スライド構成** に従って手動デザイン:
   - Brand Guideline v1.0 準拠（チタンブルー #3D6FA0 / 桜 #E48A95）
   - フォント: Noto Sans JP / Inter
   - 各スライドにプレースホルダー文字列を埋め込み（例: `{{customer_name}}`）

4. テンプレ完成後、**Service Account にシェア**:
   - 右上 **「共有」** ボタン
   - **Step 3** でメモした Service Account のメールアドレスを追加
   - 権限: **編集者**
   - 「通知」のチェックを外す
   - **送信**

5. **テンプレID** を URL から取得:
   - URL: `https://docs.google.com/presentation/d/【ここがテンプレID】/edit`
   - 例: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`

### CEO レビューチェックリスト（公開前）
仕様書 v1.0 の Section 8 を必ず実施:
- Brand Guideline v1.0 と整合
- 設立日・法人番号等の事実関係
- 「無料版で約束していい内容」のみ（v2.1 定義書と整合）
- 詳細レポート（¥5,500税込）への誘導が明示
- 補助金は名称のみ・デジタル化補助金除外
- AIツール固有名詞が出ていない
- アーキテクチャ図が含まれていない
- 文体: 過度な煽りなし
- 連絡先・URL の正確性

---

## Step 6: 環境変数設定（.env への追加）

JSON ファイルの内容を `.env` に追加します（**Git にコミットしない**）。

### 追加する環境変数

```bash
# Google Slides 自動化（無料診断レポート用）
GOOGLE_SLIDES_TEMPLATE_ID=<<Step 5 で取得したテンプレID>>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<<Step 3 でメモしたメールアドレス>>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="<<JSONファイル内の private_key の値（改行は \n のままで）>>"
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=<<JSONファイル内の project_id>>
```

### JSON ファイルからの抽出方法
ダウンロードした JSON ファイルを開くと:
```json
{
  "type": "service_account",
  "project_id": "optiens-slides-automation-xxxxxx",  ← GOOGLE_SERVICE_ACCOUNT_PROJECT_ID
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  ← GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  "client_email": "optiens-slides-automation@xxx.iam.gserviceaccount.com",  ← GOOGLE_SERVICE_ACCOUNT_EMAIL
  ...
}
```

### Vercel への追加（本番環境）
- Vercel Dashboard → プロジェクト → Settings → Environment Variables
- 上記の4変数を **Production / Preview / Development** すべてに追加

---

## Step 7: 課金上限設定（コスト管理）

GCP の予期せぬ高額請求を防ぐため、月予算アラートを設定。

1. GCP Console → **「お支払い」** → **「予算とアラート」**
2. **「予算を作成」**
3. 設定:
   - 名称: `optiens-slides-monthly-budget`
   - 対象プロジェクト: `optiens-slides-automation`
   - 予算額: **¥3,000/月**
   - アラート閾値: 50% / 90% / 100%
   - 通知先: **admin@optiens.com**
4. **保存**

> ℹ️ Slides API + Drive API は無料枠が大きいため、月¥3,000 で十分（実質ほぼ¥0想定）

---

## Step 8: 動作確認

CEO作業完了後、Claude（私）に以下を共有してください:

1. ✅ GCP プロジェクト作成完了（プロジェクトID）
2. ✅ Service Account メールアドレス
3. ✅ Slides テンプレID
4. ✅ JSONキーの環境変数化完了
5. ✅ Vercel 環境変数追加完了

私の方で以下のテストスクリプトを実行して動作確認します:
- Slides API 認証テスト
- テンプレコピー → プレースホルダー置換 → 共有設定テスト
- Resend メール送信テスト

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `403 Permission Denied` | Slides テンプレが Service Account に共有されていない | Step 5 を再実施 |
| `404 Not Found` | テンプレIDが間違い | URL の `/d/` と `/edit` の間を再確認 |
| `Quota Exceeded` | 月予算超過 | 予算額を上げる or 翌月まで待つ |
| `Invalid private_key` | 環境変数の改行が壊れている | `\n` のまま保存（実際の改行に変換しない） |

---

## 改訂履歴

| 日付 | バージョン | 変更内容 |
|---|---|---|
| 2026-05-07 | v1.0 | 初版作成 |
