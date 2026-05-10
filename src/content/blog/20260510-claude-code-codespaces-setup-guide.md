---
title: 'Claude Code を Codespaces で動かす ── 社員 PC 依存を避ける運用設計とセットアップ実践'
date: '2026-05-16'
category: 'technology'
excerpt: '中小事業者で Claude Code を社員に展開する際、社員 PC のスペック差・OS 差・セキュリティ事故リスクが導入の壁になります。本稿では GitHub Codespaces を使ったクラウド環境統一の設計思想と、Claude Code を Codespaces で動かす実装手順を整理します。'
image: '/images/blog/20260510-claude-code-codespaces-setup-guide.webp'
draft: false
---

## 「全員に Claude Code を入れる」が事故る構造

中小事業者の経営者から「社員に Claude Code を展開したいが、PC 環境がバラバラで対応しきれない」というご相談を多くいただきます。本サイトの 関連記事 [「強制」が必要な AI 導入](/blog/20260510-ai-mandatory-deployment-design) で組織導入の判断軸を整理しましたが、本稿はその **技術編** として GitHub Codespaces を使った環境統一の実装手順をお届けします。

> ※ 本稿は 2026 年 5 月時点の情報です。GitHub Codespaces / Claude Code の仕様は変動するため、最新情報は公式ドキュメントでご確認ください。

---

## なぜ Codespaces を併用するのか

### 社員 PC で直接 Claude Code を動かす場合の課題

| 課題 | 具体的な事象 |
|---|---|
| OS 差 | Windows / Mac で挙動・コマンドが違い、サポート工数が膨大 |
| スペック差 | 古い PC では Plan モードや並列処理が遅い |
| セキュリティ | 社員 PC 内のファイル全体に AI がアクセス可能 |
| 環境汚染 | Python / Node.js のバージョン衝突、ライブラリ干渉 |
| 復旧コスト | 一度壊れた環境の修復に数時間〜半日 |

### Codespaces を採用する利点

| 利点 | 内容 |
|---|---|
| 環境統一 | 全社員に同じ Linux 環境を配布、OS 差なし |
| スペック非依存 | 処理はクラウドサーバー側、社員 PC は表示のみ |
| 影響範囲限定 | AI が暴走しても社員 PC のファイルには触れない |
| 即時破棄・再作成 | 壊れたら捨てて作り直し、復旧 5 分 |
| 標準ツールセット | DevContainer 設定で全員に同じツール群 |

GitHub の公式情報では、Codespaces は「クラウド上の開発環境（cloud-hosted development environment）」として提供されており、ローカル OS に依存しない動作が保証されています。

### Codespaces の制約
- スマートフォンからの実用操作は困難（公式モバイルクライアント未提供）
- 「寝ている間に AI に働かせる」運用は会社員に対しては労務管理の観点で不可
- 月額費用が発生（GitHub プランごとに無料枠あり）

---

## 仕組みの理解

### 基本構造
| 要素 | 役割 |
|---|---|
| GitHub リポジトリ | プロジェクトコード + DevContainer 設定 |
| `.devcontainer/devcontainer.json` | Codespaces 環境の定義（OS・ツール・拡張機能） |
| Codespace | 上記定義で起動されたクラウド環境 |
| 社員 PC のブラウザ or VS Code | Codespace への接続インターフェース |
| Claude Code CLI | Codespace 内にインストール、Codespace 内で動作 |

### 動作の流れ
1. 社員が GitHub の対象リポジトリを開く
2. 「Open in Codespace」をクリック
3. クラウド側で Codespace が起動（初回は 1〜3 分、2 回目以降は数十秒）
4. 社員 PC のブラウザ or VS Code で Codespace 環境が表示される
5. Claude Code を Codespace 内で起動して通常通り使う
6. ファイル操作・コマンド実行はすべて Codespace 内で完結

---

## 実装手順

### Step 1: GitHub Organization / Codespaces プランの確認

| プラン | Codespaces 月間無料枠（コア時間） |
|---|---|
| Free 個人 | 120 時間/月 |
| Pro 個人 | 180 時間/月 |
| Team | 個別契約 |
| Enterprise | 個別契約 |

> ※ コア時間は使用するインスタンスのコア数によって消費が増える単位です。2 コアインスタンスなら 120 コア時間 = 60 実時間。最新の無料枠と消費単価は GitHub 公式のビリングページでご確認ください。

中小事業者なら Team プランで管理画面から各メンバーの利用状況を可視化する運用が現実的です。

### Step 2: リポジトリに `.devcontainer/devcontainer.json` を配置

最小構成例：
```json
{
  "name": "Optiens AI Workspace",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu-22.04",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.12"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "anthropic.claude-code"
      ]
    }
  },
  "postCreateCommand": "curl -fsSL https://claude.ai/install.sh | bash"
}
```

ポイント：
- `image`: ベース OS（Ubuntu 推奨）
- `features`: 必要なランタイム（Node.js / Python 等）
- `extensions`: 自動インストールする VS Code 拡張機能
- `postCreateCommand`: Codespace 起動後に自動実行する初期化コマンド

### Step 3: Claude Code 認証情報の管理

社員ごとに Claude アカウントを使うのか、組織アカウントを共有するのかを決めます。

| 方式 | メリット | デメリット |
|---|---|---|
| 社員ごとの個人 Anthropic アカウント | 操作ログが個人別 | 各自で Pro / Max プラン契約が必要 |
| 組織共有アカウント | 一括管理 | 操作ログが分離できない |
| Anthropic Premium Seat（チームプラン） | 一括精算 + 個人ログ分離 | 月契約 $125/人、年契約 $100/人（2026 年 5 月時点） |

中小事業者では Premium Seat が運用負荷とログ可視性のバランスが良い選択です。

### Step 4: 機密情報の隔離設計

Codespaces には GitHub Secrets と連携する **Codespaces Secrets** 機能があり、環境変数として安全に注入できます。

設定手順：
1. GitHub リポジトリ → Settings → Secrets and variables → Codespaces
2. 「New repository secret」で `OPENAI_API_KEY` 等を登録
3. Codespace 起動時に環境変数として自動注入される

`.env` ファイル直書きより安全で、Codespace 破棄時に環境変数も消えます。本サイトの 関連記事 [「.env を AI から守る」](/blog/20260510-env-isolation-from-ai-agents) と組み合わせて運用するとさらに堅牢になります。

### Step 5: 利用ルールの整備

技術構築だけでは事故は防げません。以下を CLAUDE.md or 社内 Wiki に明文化：

- 業務時間外の Codespace 稼働禁止（労務管理）
- 機密情報を含むコードは指定リポジトリのみ
- Codespaces Secrets の登録は管理者のみ
- 月次でクレジット使用量レビュー
- 不要な Codespace は週次で停止・削除

---

## つまずきやすいポイント

### 1. 初回起動が遅い
Codespace の初回起動は 1〜3 分かかります。これを「壊れた」と勘違いするケース多発。**初回は時間がかかる旨を社内向けに明記** してください。

### 2. Codespaces Secrets が反映されない
登録後、既存の Codespace には自動反映されません。**Codespace を作り直す必要** があります。

### 3. 月額クレジットの想定外消費
コア数の大きいインスタンス・GPU 付きインスタンス・常時稼働で予算を一気に消費します。**月次予算上限のアラート** を必ず設定してください。

### 4. Claude Code CLI の認証情報持ち回し
Codespace を破棄するたびに Claude Code の認証が切れます。Anthropic アカウントトークンを Codespaces Secrets に登録しておくと自動認証できます。

---

## Optiens の取り組み

Optiens では小規模組織のため Codespaces ではなくローカル PC 中心の運用ですが、AI 支援事業のクライアント案件では **規模 5 名以上の組織には Codespaces 採用を提案** する体制を取っています。本稿の DevContainer テンプレート・Codespaces Secrets 設計・利用ルール整備をパッケージ化してご提供しています。

御社で Claude Code の組織展開を検討されている場合、Codespaces 採用判断から導入支援まで [無料 AI 活用診断](/free-diagnosis) でご相談いただけます。具体的な DevContainer 設定・社内向け運用ガイドライン作成は [詳細レポート（¥5,500税込）](/free-diagnosis?paid=1) でお届けします。

---

## まとめ

- 社員 PC で直接 Claude Code は OS 差・スペック差・セキュリティで事故源
- Codespaces で環境統一すると影響範囲を限定できる
- DevContainer 設定で全員に同じツール群を配布
- Codespaces Secrets で機密情報を安全に注入
- 月次クレジット予算の上限設定が必須
- 「強制導入」記事と組み合わせて読むと組織展開の全体像が見える

---

**関連記事**:
- [「強制」が必要な AI 導入 ── 個人裁量に任せたら破綻する 3 つの構造的理由](/blog/20260510-ai-mandatory-deployment-design)
- [Claude Cowork / Claude Code Windows セットアップガイド](/blog/20260510-claude-cowork-code-windows-setup-guide)
- [「.env を AI から守る」── 機密情報の正しい隔離設計](/blog/20260510-env-isolation-from-ai-agents)

**出典**:
- GitHub Codespaces 公式ドキュメント: https://docs.github.com/en/codespaces/overview
- Anthropic Claude Code CLI 公式: https://code.claude.com/docs/en/overview
- Anthropic Pricing（Premium Seat）: https://claude.com/pricing
- Optiens 自社運用知見（DevContainer / Codespaces Secrets 設計パターン）
