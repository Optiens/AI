-- Refresh service ticket and AI diagnosis officer policy for admin knowledge.

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
) values (
  'service-ticket-menu-policy',
  'スポット相談チケット・AI診断官β・有償要件定義の運用定義',
  'sales',
  'COO / CFO',
  'internal',
  'operational',
  'AI診断官βを入口・体験デモ・詳細版価値増強として扱い、単発AI相談は1枚、有償要件定義は2枚、簡易実装は3枚からに整理した営業運用定義。',
  $kb$
## 基本方針

AI診断官βはスポット相談チケット1枚で販売する独立商品ではない。入口、体験デモ、情報収集ソース、詳細版AI活用診断の価値増強として使う。

## チケット価格

- スポット相談チケット: 1枚 ¥33,000（税込、税抜¥30,000）
- 単発AI相談: 1枚。60分目安の人間相談。導入支援費へ充当しない
- 有償要件定義: 2枚。導入支援前の有料スコーピング。成約時は2枚分を初期費用へ充当
- 簡易実装・軽微な自動化: 原則3枚から
- 4枚以上、外部API連携、本番運用、認証、個人情報、決済、継続監視は個別見積

## AI診断官β

- `/ai-diagnosis-officer` で購入前デモを公開する
- 音声モードとテキストモードを併設する
- 音声モードは静かな環境での利用を推奨する
- 声の選択は現在できない
- AIが話している間は聞き取りを止め、割り込みを抑制する
- 会話後は文字起こしではなく診断メモを生成する
- `response.done` のusageを拾い、1セッションごとの推定API原価を管理画面に表示する

## 顧客導線

1. 無料診断または詳細版AI活用診断で入口を作る
2. 購入前にAI診断官βデモで体験してもらう
3. 詳細版で追加情報が必要な場合はAI診断官βでヒアリングし、診断メモとして補強する
4. 人間相談が必要な場合は単発AI相談へ切り替える
5. 導入支援前に範囲を固める場合は有償要件定義へ切り替える
$kb$,
  array['スポット相談チケット', 'AI診断官β', '単発AI相談', '有償要件定義', '簡易実装', '推定API原価'],
  'executive/ai-consulting/サービスチケット定義.md; executive/ai-consulting/用語マスタ.md; user directive 2026-05-17',
  now(),
  'codex'
) on conflict (id) do update set
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
