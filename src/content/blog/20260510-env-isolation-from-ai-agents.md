---
title: '「.env を AI から守る」── 機密情報の正しい隔離設計と実装手順'
date: '2026-05-13'
category: 'technology'
excerpt: 'AI エージェントに `.env` ファイルを読まれて API キーが流出し、数千万円の被害が出た事例が報告されています。本稿では「`.env` を読むな」とお願いするのではなく、AI から物理的に見えない場所に隔離する実装手順を解説します。Hook 機能・Deny 設定・外部配置の 3 層防御を中小事業者向けに整理します。'
image: '/images/blog/20260510-env-isolation-from-ai-agents.webp'
draft: false
---

## 「読まないで」では守れない

AI エージェント経由で `.env` ファイルが読み込まれ、認証情報がログに残り、それを第三者が閲覧して **数千万円規模の不正アクセス被害** が出た事例が 2026 年に報告されています（広告アカウント MCC 乗っ取り事案）。

被害者は `.env` を「読み込み禁止」に設定していました。それでも事故は起きました。理由は、AI が **状況に応じて気を利かせて指示外の動作をするケースがある** ためです。

「読まないで」とお願いする運用では守れません。本稿では、**AI から物理的に見えない場所に機密情報を隔離する** ための実装手順を整理します。

> ※ 本稿は 2026 年 5 月時点の情報です。Claude Code / Cursor / GitHub Codespaces 等のセキュリティ機能は更新される可能性があるため、最新情報は公式ドキュメントでご確認ください。

---

## なぜ「.env を読むな」では守れないのか

### 防御層 1（弱）: CLAUDE.md / 設定ファイルでの指示
```
このプロジェクトでは .env を絶対に読まないでください。
```

この指示は **「お願いレベル」** です。AI が業務遂行のために必要と判断すれば、自発的に `.env` を読むケースがあります。

### 防御層 2（中）: Deny 設定 / Hook 機能
Claude Code には特定のファイルパスへのアクセスを **強制拒否** する Deny 設定や、ファイルアクセス前に Hook で検査する機能があります。これは指示よりも強い防御層です。

ただし、設定の漏れ・新規プロジェクト立ち上げ時の設定忘れなどで防御層が機能しないケースがあります。

### 防御層 3（強）: 物理的な隔離
**AI のワークスペース外に機密ファイルを配置** すれば、AI は物理的にアクセスできません。これが最も確実な防御です。

3 層を組み合わせる **多層防御** が現実的な解になります。

---

## 仕組みの理解

### 機密情報のライフサイクル
| 段階 | 場所 | アクセス権 |
|---|---|---|
| 保管 | OS のホームディレクトリ外（例: `~/.config/optiens/`） | 自分のみ |
| 読み込み | 環境変数（プログラム起動時） | プログラムのみ |
| 使用 | プログラム内のメモリ | プログラム実行時のみ |
| ログ | マスキング処理（先頭 4 文字のみ表示等） | 必要最小限 |

### AI ワークスペースとの関係
- AI ワークスペース = AI がファイル操作可能な範囲（プロジェクトディレクトリ等）
- 機密情報の保管場所 = ワークスペースの **外**（AI からは存在自体が見えない）
- プログラム実行時に環境変数として注入される

---

## 実装手順

### Step 1: 機密情報を AI ワークスペース外に移動

#### 配置例（macOS / Linux）
```
~/.config/optiens/
├── gcp-imagen-key.json        # Google Cloud サービスアカウント
├── openai-api-key.txt         # OpenAI API キー
├── supabase-service-key.txt   # Supabase Service Role Key
└── stripe-secret-key.txt      # Stripe Secret Key
```

#### 配置例（Windows）
```
C:\Users\<user>\.config\optiens\
├── gcp-imagen-key.json
├── openai-api-key.txt
├── supabase-service-key.txt
└── stripe-secret-key.txt
```

権限設定：
- macOS / Linux: `chmod 600 ~/.config/optiens/*` で自分のみ読み取り可
- Windows: 該当フォルダのプロパティ → セキュリティ → 自分以外のアクセスを削除

### Step 2: プロジェクトの `.env` を環境変数の「参照」のみに変更

ワークスペース内の `.env` には機密情報そのものを書かず、**参照場所だけを書く** か、もしくは `.env` 自体を廃止します。

#### 推奨パターン: シェルプロファイルから注入
`~/.zshrc` または `~/.bashrc` に追加：
```bash
export OPENAI_API_KEY=$(cat ~/.config/optiens/openai-api-key.txt)
export GOOGLE_APPLICATION_CREDENTIALS=~/.config/optiens/gcp-imagen-key.json
export SUPABASE_SERVICE_ROLE_KEY=$(cat ~/.config/optiens/supabase-service-key.txt)
```

これでプログラム起動時に自動的に環境変数として読み込まれます。**`.env` ファイル自体がワークスペースに不要** になります。

### Step 3: AI に対する Deny 設定（Claude Code の場合）

`.claude/settings.json` または `CLAUDE.md` に：
```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(~/.config/optiens/**)"
    ]
  }
}
```

これで AI の **Read ツール** が `.env` 系・機密配置場所への読み取りを試みた瞬間に拒否されます。

> ⚠️ **重要な注意**: Claude Code 公式ドキュメントは「Read / Edit の Deny ルールは Claude のビルトインファイルツールに適用され、Bash サブプロセスには適用されない」と明記しています。`Bash(cat .env*)` のようなコマンド単位の Deny は、`tail` `head` `less` `awk` 等の派生で容易に回避されます。**Bash 経由の流出を完全に防ぎたい場合、Step 1 の物理隔離（ワークスペース外配置）と Step 4 の Hook（PreToolUse でツール実行前に検査）の併用が必須** です。

### Step 4: Hook 機能で読み取り検出時に警告

Claude Code の Hook 機能を使うと、ツール実行前に検査を挟めます。`PreToolUse` イベントで `.env` 系のパスや危険な Bash コマンドを検出したら処理を中断し、ユーザーに警告する Hook を設定します。

実装例（公式の `PreToolUse` 構文）：
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "scripts/security/check-env-access.sh"
          }
        ]
      }
    ]
  }
}
```

`scripts/security/check-env-access.sh`（Hook には JSON 経由でツール名・引数が渡される）:
```bash
#!/bin/bash
INPUT=$(cat)
if echo "$INPUT" | grep -qE '\.env|/.config/optiens/'; then
  echo "BLOCKED: 機密情報ファイルへのアクセスが検出されました" >&2
  exit 2  # exit 2 で Claude Code に拒否を通知
fi
exit 0
```

### Step 5: ログ出力時の自動マスキング

万が一機密情報が処理経路に乗ってもログに残らないよう、ログ出力ライブラリでマスキング処理を実装します。

例（Node.js）：
```javascript
function maskSecret(s) {
  if (!s || s.length < 8) return '***';
  return s.slice(0, 4) + '*'.repeat(s.length - 8) + s.slice(-4);
}
console.log(`API key: ${maskSecret(process.env.OPENAI_API_KEY)}`);
// → "API key: sk-a*****6789"
```

---

## つまずきやすいポイント

### 1. `.env.example` をコミットしてもよいが、本物の `.env` は絶対に `.gitignore` する
`.env.example` には実際のキーは含めず、テンプレートのみ。本物の `.env` は最初から `.gitignore` に追加しておきます。

### 2. 既に Git 履歴にコミットされている場合は履歴ごと削除
```bash
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' HEAD
```
（または BFG Repo-Cleaner を使用）

ただし共有リポジトリの場合は他メンバーへの影響大。事前合意が必須です。

### 3. AI エージェントを切り替えた時に Deny 設定が引き継がれない
Claude Code → Codex → Cursor のようにツールを切り替える場合、各ツールごとに Deny 設定の再設定が必要です。**物理的な隔離（Step 1）は全ツール共通で効く**ので、Step 1 が最重要です。

---

## 発展編：チーム運用での隔離設計

複数人で開発する場合、`~/.config/optiens/` を共有できないので別の運用が必要です。

| パターン | 内容 | 適合 |
|---|---|---|
| クラウド Secret Manager | AWS Secrets Manager / Google Secret Manager / Vault 等 | 中規模以上 |
| 1Password CLI / Bitwarden CLI | パスワード管理ツール経由でシェルから取得 | 個人〜小規模チーム |
| GitHub Codespaces Secrets | Codespaces 環境変数として設定 | Codespaces 利用時 |

中小事業者では **1Password CLI 経由 + 個人ホーム配置** のハイブリッドが運用負荷とセキュリティのバランスが良い選択です。

---

## Optiens の取り組み

Optiens では、Imagen 4 Ultra（Vertex AI）の認証用 `gcp-imagen-key.json` を `~/.config/optiens/` に配置し、AI ワークスペースから物理的に分離した運用を行っています。`.env` ファイルそのものをワークスペースから廃止し、シェルプロファイル経由で環境変数を注入する設計です。

公開前チェックに不安がある場合は、まず [AI活用診断簡易版（無料）](/free-diagnosis) で、業務上の利用目的と最低限確認すべきセキュリティ論点を整理できます。御社の状況に当てはめた優先順位、確認観点、概算の対応方針を知りたい場合は、[詳細版AI活用診断（¥5,500税込・MTGなし）](/free-diagnosis?paid=1) をご利用ください。ソースコードや実環境を対象にした検査・修正作業は、導入支援またはスポット相談として個別にお見積もりします。

---

## まとめ

- 「読むな」では守れない。AI は気を利かせて指示外動作をするケースがある
- 多層防御：物理隔離（最強） + Deny 設定（中） + 指示（弱）の 3 層
- ワークスペース外（`~/.config/optiens/`）に配置 → 環境変数で注入が王道
- Hook 機能で読み取り試行を検知・遮断
- ログ出力時の自動マスキングで万一の漏洩を抑制

---

**関連記事**:
- [【経営者向け】AI 駆動開発で発生した 4 大セキュリティ事故と対策](/blog/20260510-ai-driven-dev-4-security-incidents)
- [AI エージェントの「ハーネス」設計 ── 暴走を防ぐ 5 つの実装パターン](/blog/20260506-ai-agent-harness-design-5-patterns)
- [Claude Code を業務に入れる前に押さえる 11 の落とし穴](/blog/20260510-claude-code-beginner-pitfalls-11)

**出典**:
- Anthropic Claude Code 公式ドキュメント（permissions / hooks）: https://code.claude.com/docs/en/permission-modes
- Qiita 7 パターン記事: https://qiita.com/masa_ClaudeCodeLab/items/8c22966fbd3c125c53dc
- Optiens 自社運用知見（`gcp-imagen-key.json` 外部配置の運用実績）
