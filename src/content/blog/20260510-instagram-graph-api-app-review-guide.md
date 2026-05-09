---
title: 'Instagram Graph API の App Review を突破する ── 中小事業者向け 5 つの準備事項'
date: '2026-05-10'
category: 'technology'
excerpt: 'Instagram のコメント・メンションを自動監視・自動返信したい場合、最大の壁は Meta の「App Review 承認」です。通常 2〜4 週間かかり、却下されると追加で数週間ロスします。本稿では中小事業者向けに、App Review を一発で通すための 5 つの準備事項と、却下されやすい典型パターン、Development mode で先行構築できる範囲を整理します。'
image: '/images/blog/20260510-instagram-graph-api-app-review-guide.webp'
---

## 「公式 API があるのに、すぐ動かない」もう一つの壁

Instagram のコメント・メンションを自動監視したい中小事業者にとって、Instagram Graph API は **公式かつ無料** で使える唯一の選択肢です。

しかし、Google Business Profile API と同様、**実運用までに承認プロセス** があります。

- **Development mode（開発モード）**: 自社アカウントでの検証は即時可能
- **Live mode（本番モード）への移行**: Meta の **App Review 承認** が必要、通常 2〜4 週間

「来週から本番運用したい」というご相談に対しては、**この承認期間を最初から計画に含める** 必要があります。

→ Google Business Profile API の同様の壁については [Google Business Profile API は申請承認制](/blog/20260509-google-business-profile-api-application-approval) もご覧ください。

---

## App Review が必要な権限と不要な権限

Instagram Graph API のすべての機能が App Review を必要とするわけではありません。

| 用途 | 必要な権限 | App Review |
|---|---|---|
| 自社アカウントの検証・テスト | （Development mode）| **不要** |
| 顧客アカウントの基本情報取得 | `instagram_basic` | **必要** |
| 顧客アカウントのコメント取得・返信 | `instagram_manage_comments` | **必要** |
| 顧客アカウントへのメンション取得 | `instagram_manage_comments`（同権限）| **必要** |
| Insights データ取得 | `instagram_manage_insights` | **必要** |
| 自社の SaaS / B2B サービス提供 | 上記すべて | **必要** |

**ポイント**: 「顧客の Instagram アカウントを管理する」目的なら、ほぼ確実に App Review が必要です。

---

## App Review が却下される典型パターン 5 つ

### パターン 1: ユースケースが曖昧

「データを分析する」「マーケティング目的」のような **抽象的な記述** は却下対象です。

NG:
> Our app helps businesses analyze their Instagram data.

OK:
> Our app monitors comments and mentions on cafe businesses' Instagram accounts. When negative reviews are posted, we send LINE notifications to store owners within 5 minutes. AI generates draft replies for review and one-click posting.

**具体的な対象 / 機能 / フロー** を明示する必要があります。

### パターン 2: スクリーンキャスト動画が不明瞭

App Review では **アプリの実機操作動画**（スクリーンキャスト）の提出が必要です。

NG な動画:
- 本番データを使わずモック画面を映す
- 各権限の用途を 1 つずつ実演していない
- 音声・字幕で説明がない（英語でも日本語＋英訳でも可）

OK な動画:
- 各権限を **1 つずつ** Instagram の実画面で実演（取得・返信・分析）
- ナレーションで「この権限を使って〇〇します」と説明
- 1〜3 分の長さに収める

### パターン 3: プライバシーポリシー・利用規約が不在

申請時に **プライバシーポリシー URL** と **利用規約 URL** が必須です。

最低限必要な記述:
- 取得するデータの種類（コメント・メンション・基本プロフィール等）
- データの保管場所・保管期間
- 第三者との共有有無
- 削除依頼への対応窓口

これらが事前に Web サイトに公開されていないと、**申請段階で止まります**。

### パターン 4: ビジネス実態の不在

Meta は「**実在する事業者** のためのアプリ」を承認します。

却下されるケース:
- ドメインが取れたばかりで、Web サイトの中身が薄い
- 会社情報・連絡先がない
- ビジネスモデルが不透明

OK にするには:
- 会社案内・サービスページ・連絡先を整備
- ドメインに過去の運用履歴がある
- LinkedIn / 法人登記情報との一貫性

### パターン 5: 大規模な顧客数を最初の申請で主張

「100 店舗を管理する SaaS です」と最初の申請で書くと、審査が長引いたり却下されることがあります。

OK な進め方:
1. **最初の申請は「自社・限定的な顧客向け」** に絞る
2. Live mode で 3〜6 ヶ月運用実績を作る
3. その後、**追加申請** で対象範囲を拡大

---

## App Review を一発で通す 5 つの準備事項

### 準備 1: プライバシーポリシー・利用規約の事前公開

Web サイトに以下を配置:
- `/privacy-policy`（プライバシーポリシー）
- `/terms-of-service`（利用規約）

**Optiens の例**: [プライバシーポリシー](/privacy-policy)

Instagram で取得するデータの種類・用途を明記。テンプレで作る場合も、**自社の実態に合わせて編集** する必要があります。

### 準備 2: スクリーンキャスト動画の準備

各権限に対応した実演動画を準備:

- `instagram_manage_comments`: 自社 IG でコメントを取得・自動返信を実演
- `instagram_manage_mentions`: メンション取得を実演
- `instagram_manage_insights`: Insights データ取得を実演

**ツール**: Loom, OBS Studio, ScreenStudio 等。1〜3 分・英語ナレーション（または字幕）。

### 準備 3: アプリの URL・スクリーンショット

- アプリの管理画面 URL（テスター招待で Meta レビュアーがアクセス可能に）
- スクリーンショット 3〜5 枚

### 準備 4: ユースケース説明文（英語）

申請フォームに記入する英文。**抽象的な表現を避け**、具体的なフローを記述:

```
Use case for instagram_manage_comments:
- Cafe businesses receive customer comments on their Instagram posts
- Our app monitors new comments via webhook
- AI classifies sentiment (positive / negative / question)
- Negative comments trigger LINE notification within 5 minutes
- Draft replies are generated and shown to the cafe owner for one-click approval
- Approved replies are posted via the API
```

### 準備 5: Development mode での先行構築

App Review 承認待ちの 2〜4 週間を有効活用するため、**先に構築可能な部分** を完了させておきます:

Development mode で実装可能:
- ✅ 自社 IG アカウントでの取得・返信テスト
- ✅ AI 分類・返信生成ロジック
- ✅ データベース構成（Supabase 等）
- ✅ 通知連携（LINE / Slack / メール）
- ✅ ダッシュボード UI

承認後、**API キーを差し替えるだけで本番稼働** できる状態にしておくのが理想的です。

---

## 申請フロー全体像

```
Step 1: Meta Developer アカウント作成（即日）
   ↓
Step 2: Facebook App 作成 + Instagram プロダクト追加（即日）
   ↓
Step 3: Development mode で自社 IG 検証（1〜2 週間）
   ↓
Step 4: プライバシーポリシー・利用規約・動画準備（並行）
   ↓
Step 5: App Review 申請（即日）
   ↓
Step 6: Meta レビュー（通常 2〜4 週間）
   ↓
Step 7: 承認 → Live mode 切替（即日）
   ↓
Step 8: 本番運用開始
```

申請から承認まで含めて **3〜6 週間** を見ておくのが現実的です。

---

## Optiens の取り組み

Optiens では、Instagram Graph API・Google Business Profile API の **申請サポート** を導入支援に含めています。

- ユースケース説明文の英訳・推敲
- スクリーンキャスト動画の構成支援
- プライバシーポリシー・利用規約のテンプレート提供
- Development mode での先行構築（承認待ち期間の有効活用）

口コミ自動監視デモは [/review-monitor](/review-monitor) でご覧いただけます（モックデータで動作）。

---

## まとめ

- Instagram Graph API は無料だが、顧客アカウントを扱うには **App Review 承認** が必要
- 通常 **2〜4 週間**、却下されるとさらに数週間ロス
- 一発で通す鍵: **プライバシーポリシー整備 / 具体的ユースケース / 実演動画 / ビジネス実態 / 段階的範囲拡大**
- 承認待ち期間に **Development mode で先行構築** すれば、承認後すぐ運用開始

申請プロセスを含めた構築計画が必要でしたら、[無料 AI 活用診断](/free-diagnosis) からご相談ください。

---

**出典**:
- Meta for Developers App Review 公式ドキュメント
- Instagram Graph API 公式ガイド
- 2026 年 5 月 10 日時点の調査
