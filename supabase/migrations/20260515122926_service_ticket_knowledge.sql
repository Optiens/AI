-- Seed service ticket definitions for admin knowledge.

insert into public.knowledge_entries (
  id,
  title,
  category,
  owner,
  visibility,
  maturity,
  summary,
  body,
  tags,
  source,
  updated_at,
  updated_by
) values
(
  'service-ticket-menu-policy',
  'スポットチケット・要件定義・個別見積の運用定義',
  'sales',
  'COO / CFO',
  'internal',
  'operational',
  '単発相談、AI活用レビュー面談、有償要件定義、簡易実装、個別見積への切り替え条件を整理した営業運用定義。',
  $kb$
## 基本方針

小さな相談はスポットチケット、大きな導入支援は個別見積、導入後の継続改善は保守チケットで扱う。都度見積だけに寄せると小さな相談の心理的ハードルと見積工数が上がるため、入口はチケット制で軽くし、責任範囲が広がる案件は個別見積に切り替える。

## スポットチケット

- 価格: 1枚 ¥30,000（税抜）
- AI活用レビュー面談: 1枚
- 有償要件定義: 1枚
- 簡易実装・軽微な自動化対応: 原則3枚から

## 有償要件定義の扱い

有償要件定義はスポットチケット1枚で実施する。導入支援の本契約に進む場合は、支払済みのスポットチケット1枚分を本契約の初期費用へ充当する。本契約に進まない場合も、要件整理の対価として返金しない。

## 簡易実装3枚の範囲

3枚で受けるのは「何でも99,000円で作る」ではない。対象は、1業務・1フロー・既存ツール前提・設定または簡易実装・動作確認1回・軽微な修正1回までに絞る。本番運用保証、継続監視、複数部門展開、複雑な例外処理は含めない。

## 個別見積へ切り替える条件

- 4枚以上になりそうな依頼
- 外部API連携、認証、個人情報、決済、本番運用、継続保守が絡む依頼
- 複数業務・複数部門・複数システムにまたがる依頼
- 契約書、工程表、検収基準、運用設計が必要な依頼
- 初期費用30万円以上の導入支援に相当する依頼

## 営業時の説明

「スポットチケットは相談・要件整理・小さな改善のための入口です。範囲が大きい場合は、途中で無理にチケット消化せず、個別見積に切り替えます」と説明する。
$kb$,
  array['スポットチケット', '有償要件定義', 'AI活用レビュー面談', '簡易実装', '個別見積'],
  'user directive 2026-05-15; executive/ai-consulting/サービスチケット定義.md; src/pages/maintenance.astro',
  now(),
  'codex'
),
(
  'maintenance-ticket-plan-policy',
  '保守チケットプランの運用定義',
  'operations',
  'COO / CFO',
  'internal',
  'operational',
  '保守ライト、スタンダード、追加チケット、スポットチケットとの使い分けを整理した運用定義。',
  $kb$
## 基本方針

保守は時間カウントではなく、依頼内容の重さに応じたチケット制で運用する。チケット枚数は着手前に提示し、顧客承認後に消化する。

## ライト

- 月額: ¥45,000（税抜）
- 月次チケット: 3枚
- 内部単価: 1枚 ¥15,000
- 対象: 日常運用を安定して回したい顧客
- 主な用途: メール・チャット相談、軽微な調整、プロンプト微調整、トラブル調査・暫定対応、連携サービスの仕様変更追従

## スタンダード

- 月額: ¥80,000（税抜）
- 月次チケット: 8枚
- 内部単価: 1枚 ¥10,000
- 対象: 継続的にAI活用範囲を広げたい顧客
- 主な用途: ライトの全内容、月次オンラインMTG、機能追加、ワークフロー改善、新規業務の自動化検討・初期設計

## リセットと追加チケット

月次チケットは毎月リセットし、繰越はしない。不足時は追加チケット購入または上位プランへの変更で対応する。追加チケットはライト ¥18,750／枚、スタンダード ¥12,500／枚（いずれも税抜、通常単価の1.25倍）。

## スポットチケットとの使い分け

保守契約がない顧客の単発相談・小規模作業はスポットチケット（¥30,000／枚・税抜）で受ける。保守契約中の顧客は、原則として月次チケットまたは追加チケットを使う。保守の範囲を超える大きな改修は個別見積に切り替える。
$kb$,
  array['保守', 'ライト', 'スタンダード', '追加チケット', 'スポットチケット'],
  'user directive 2026-05-15; executive/ai-consulting/サービスチケット定義.md; src/pages/maintenance.astro',
  now(),
  'codex'
)
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  owner = excluded.owner,
  visibility = excluded.visibility,
  maturity = excluded.maturity,
  summary = excluded.summary,
  body = excluded.body,
  tags = excluded.tags,
  source = excluded.source,
  updated_at = now(),
  updated_by = excluded.updated_by;
