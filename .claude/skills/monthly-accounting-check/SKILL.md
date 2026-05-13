---
name: monthly-accounting-check
description: 月初に先月分のfreee記帳状況・口座同期・役員報酬・経費漏れをチェックし、CEOに月次会計レポートを提示する
---

# 月初経理チェックSkill — /monthly-accounting-check

毎月初（1〜5日推奨）に実行する経理・会計の自動チェック。先月分の漏れや異常を検出してCEOに報告する。

## 対象事業所

- 合同会社Optiens（freee company_id: 12562850）

## 実行手順

### 1. 認証確認
```
mcp__freee__freee_auth_status
mcp__freee__freee_get_current_company
```

### 2. 口座同期状態の確認

```
GET /api/1/walletables?company_id=12562850&with_balance=true
```

- **チェック項目**:
  - GMOあおぞらネット銀行（id: 4713547）の `update_date` が今日から3日以内か
  - freeeカード Unlimited（id: 2584121）の `update_date` が今日から3日以内か
- 同期が止まっていれば「口座連携の再認証が必要」とアラート

### 3. 先月分の仕訳取得

```
GET /api/1/deals?company_id=12562850&start_issue_date=YYYY-MM-01&end_issue_date=YYYY-MM-末日&limit=200
```

- 仕訳件数を集計
- 役員報酬（account_item_id: 1033228867）の仕訳が**先月の月末日付**で存在するか確認
  - 存在しない → CEOに「先月分役員報酬の起票漏れ」アラート
  - 金額が想定（4-6月: 58,000円 / 7月以降: 500,000円）と一致するか

### 4. 経費の抜けチェック

- 個人口座・個人クレカからの立替（役員借入金 1033228938）の合計を集計
- 領収書添付なし（`receipts: []`）の経費が3件以上あれば「レシート添付推奨」アラート
- 同一金額・同一日の重複可能性を機械チェック

### 5. 按分対象経費の確認

自宅兼事務所のため、以下は**事業使用割合 1/3 按分**:
- 水道光熱費（電気・ガス・水道）
- 通信費（自宅インターネット・固定電話）

按分されていない疑いがあれば（10,000円超で按分注記なし等）、CEOに確認を促す。

### 6. 月次レポート出力

CEOに以下を提示:

```markdown
## 2026年X月 月初経理チェック結果

### 口座同期
- GMOあおぞら: ✓ / 同期遅延（最終YYYY-MM-DD）
- freeeカード: ✓ / 同期遅延

### 先月仕訳サマリー
- 仕訳件数: N件
- 役員報酬: ✓ 起票済（YYYY-MM-DD・XX,000円）/ ❌ 未起票
- 経費合計: XXX,XXX円
- 立替（役員借入金）残高: XXX,XXX円

### 要対応
- [ ] ◯◯（具体的な指摘）
- [ ] ◯◯
```

問題なしなら「異常なし」と1行で完了。

## 実行タイミング

- 毎月1〜5日のいずれか
- Googleカレンダーに「月初経理チェック」を毎月1日リマインダー登録推奨
- もしくは `/monthly-accounting-check` を手動実行

## 関連メモリ・参照

- 役員報酬スキーム: `memory/project_compensation-strategy.md`、`memory/user_personal-info.md`
- 経費精算運用ルール: `executive/finance/経費精算運用ルール_v1.0.md`
- 月次レビューフォーマット: `executive/finance/月次レビューフォーマット_v1.0.md`
