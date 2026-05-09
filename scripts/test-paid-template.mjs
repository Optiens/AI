/**
 * 有償版テンプレのビジュアルテスト
 *
 * 動作:
 * 1. 有償版テンプレを Service Account でコピー
 * 2. すべての {{paid_xxx}} プレースホルダーをサンプルデータで置換
 * 3. 共有設定（anyone with link, reader）
 * 4. URL を出力
 *
 * OpenAI / Resend は使わない（レイアウト検証専用）
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
try {
  const env = readFileSync(envPath, 'utf-8');
  env.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+?)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (v) process.env[k] = v;
    }
  });
} catch {}

const TEMPLATE_ID = '1qsP-lL2yCRMVUdIQw4Y1ARlJ_e_rAqlV5Myfuf-83hI';
const OUTPUT_FOLDER_ID = '0AP-9nfOx7k3HUk9PVA';
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SA_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SA_EMAIL || !SA_PRIVATE_KEY) {
  console.error('GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY 必要');
  process.exit(1);
}

// ===== Google JWT Auth =====
import crypto from 'crypto';

async function getGoogleToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const sig = crypto.sign('RSA-SHA256', Buffer.from(signingInput), SA_PRIVATE_KEY);
  const sigB64 = sig.toString('base64url');
  const jwt = `${signingInput}.${sigB64}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`OAuth: ${await res.text()}`);
  const { access_token } = await res.json();
  return access_token;
}

// ===== サンプルデータ =====
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
const SAMPLE = {
  // 表紙
  paid_customer_name: '合同会社Optiens（テスト）',
  paid_diagnosis_date: today,

  // エグゼクティブサマリー（初期費用は MTG 後の個別見積で別途提示するためここでは出さない）
  paid_summary_value_yen: '186,000',
  paid_summary_hours: '124',
  paid_summary_period: '3〜4週間',
  paid_initiative_1_title: '見積・提案書ドラフト生成 AI',
  paid_initiative_1_desc: 'ヒアリング情報からテンプレ準拠のドラフトを自動生成。承認は人。',
  paid_initiative_2_title: '問い合わせ一次回答 AI',
  paid_initiative_2_desc: 'FAQ・過去対応データから一次回答案を即生成。担当は確認・調整のみ。',
  paid_initiative_3_title: '議事録要約・レポート生成 AI',
  paid_initiative_3_desc: '会議録音から要点要約・アクション抽出。週次レポートも自動化。',
  paid_executive_summary: '上記 3 施策により、月間 124 時間（月 ¥186,000 相当）の業務時間を圧縮可能です。AI 駆動開発で 3〜4 週間の短期実装。投資回収は約 3 ヶ月の試算です。',

  // 現状分析
  paid_current_analysis_left: '従業員1名の小規模体制ながら、AI支援・水耕栽培・小説出版の3事業を展開。Webサイト運用、フォーム経由の問い合わせ対応、提案書作成、見積作成が中心業務。Google Workspace・Notion・freeeを活用済で、デジタル基盤は整備済。AI活用は組織的に活用中。',
  paid_current_analysis_right: '問い合わせ対応の一次回答に時間がかかる傾向。提案書・見積の作成は反復的だが個別調整が必要。レポート作成・議事録要約も時間消費要因。データ整備は良好だが、フォームから提案までのフローが手動でつながっている部分が多い。',

  // 提案 1-7（1提案=1ページ詳細展開）
  // 優先度判定軸: 致命度（業務影響度）× 実装容易性 × ROI
  // 削減時間は「件数 × 単件処理時間」の実績または典型値ベース
  ...Object.fromEntries(
    [
      {
        area: '見積作成の半自動化',
        effect: '月 20 時間削減',
        effectBasis: '月 50 件 × 24 分/件 = 20h／実績: 過去6ヶ月の見積作成数の中央値は週 12 件、1 件あたり手作業で 20〜30 分。AI 化で確認のみの 4 分／件に圧縮。',
        critical: '高 ── 受注機会損失に直結',
        priority: '優先度 A（高）',
        priorityBasis: '致命度高 × テンプレ整備済で実装容易 × ROI最大',
        overview: '問い合わせ→要件ヒアリング→見積作成→送付の一連工程のうち、要件→見積算出→送付ドラフトを AI が自動化。受注スピードを上げる中核施策。',
        flowBefore: '①顧客から問い合わせ\n②担当が単価表を都度参照\n③Excel に手入力\n④注意事項を文章で書く\n⑤PDF 化して送付',
        flowAfter: '①問い合わせフォームから要件取得\n②AI が単価DB を参照し自動算出\n③AI が注意事項を生成\n④担当が確認 (4 分)\n⑤自動 PDF 化・送付',
        architecture: '[Webフォーム] → [Supabase: 単価DB・案件管理] → [AI API: Claude/GPT で見積算出 + 文面生成] → [PDF 生成 (Edge Function)] → [メール送信 (Resend)]',
        prereq: '単価表・標準テンプレ整備',
      },
      {
        area: '顧客対応の一次回答自動化',
        effect: '月 10 時間削減',
        effectBasis: '月 100 件 × 6 分/件 = 10h／実績: 過去 3 ヶ月の問い合わせ件数は月 80〜120 件。FAQ 網羅率 80% 想定で AI が一次回答→担当は確認・調整のみ（2 分／件に圧縮）。',
        critical: '高 ── 応答遅延が機会損失',
        priority: '優先度 A（高）',
        priorityBasis: '致命度高 × FAQ整備済で実装容易',
        overview: 'お問い合わせフォーム経由の質問に対し、FAQ・過去対応データを RAG で参照しながら AI が一次回答ドラフトを生成。担当者は内容確認のみで送信可能。',
        flowBefore: '①問い合わせ受信\n②担当者が内容確認\n③過去メールを検索\n④回答文を都度作成\n⑤上長確認→送信',
        flowAfter: '①問い合わせ受信\n②AI が過去対応 + FAQ から回答ドラフト生成\n③担当が確認・調整 (2 分)\n④送信',
        architecture: '[フォーム/メール] → [Supabase pgvector: FAQ + 過去対応の埋め込み] → [RAG: 類似ケース検索] → [AI API: 回答ドラフト生成] → [担当ダッシュボード] → [送信]',
        prereq: 'FAQ整備、過去対応データ 50 件以上',
      },
      {
        area: '議事録要約・アクション抽出',
        effect: '月 15 時間削減',
        effectBasis: '月 20 会議 × 45 分/会議 = 15h／実績: 週 5 件の打合せ × 4 週 = 月 20 件。録音から要約・アクション整形にかかっていた 1 件あたり 50 分が、AI 自動生成 + 人確認 5 分／件に。',
        critical: '中 ── 業務記録の質に影響',
        priority: '優先度 A（高）',
        priorityBasis: '実装容易 × 継続効果（録音体制が前提）',
        overview: 'Web 会議の録音データを文字起こし→要約→アクションアイテム抽出まで自動化。会議終了から 5 分以内に整形済み議事録が共有される運用を実現。',
        flowBefore: '①会議実施\n②担当が手書きメモ\n③会議後に整形\n④Slack に投稿\n⑤ToDo を別途管理',
        flowAfter: '①会議実施（録音）\n②AI が文字起こし + 要約\n③アクション自動抽出\n④担当が 5 分確認\n⑤Slack + Tasks に自動連携',
        architecture: '[Web会議録音 (Zoom/Meet)] → [文字起こし API (Whisper等)] → [AI API: 要約 + アクション抽出 (構造化出力)] → [Slack Webhook / Google Tasks API]',
        prereq: '録音システム導入',
      },
      {
        area: '提案書ドラフト生成',
        effect: '月 25 時間削減',
        effectBasis: '月 15 提案 × 100 分/提案 = 25h（初稿執筆部分のみ）／実績: 過去 6 ヶ月の提案数中央値 15 件、初稿執筆に 100〜150 分かかっていた工程。AI ドラフト + 人による調整 30 分／件に圧縮。',
        critical: '中 ── 提案品質は最終的に人が担保',
        priority: '優先度 B（中）',
        priorityBasis: '削減時間最大だが、案件ごとの個別調整負荷が大きく AI 初稿の品質リスクあり。Phase2 推奨',
        overview: 'ヒアリング情報・過去成約案件・テンプレートライブラリを参照し、提案書の初稿を AI が自動生成。校正・個別調整は人が担当。',
        flowBefore: '①ヒアリング実施\n②過去案件を検索\n③テンプレを開く\n④初稿を執筆 (100〜150 分)\n⑤上長レビュー',
        flowAfter: '①ヒアリングをフォームに入力\n②AI が類似案件 + テンプレから初稿生成\n③担当が個別調整 (30 分)\n④上長レビュー',
        prereq: 'テンプレートライブラリ整備',
      },
      {
        area: '業務マニュアル RAG 検索',
        effect: '月 12 時間削減',
        effectBasis: '社員 5 名 × 質問 10 件/月 × 平均 15 分/件 ≒ 12.5h／実績: 業務マニュアルの参照に時間がかかる、もしくは結局先輩に質問するケースを集計。AI 検索で即時回答に。',
        critical: '中 ── 新人立ち上げと属人化排除に直結',
        priority: '優先度 B（中）',
        priorityBasis: '効果中だがマニュアル整備状況に依存。整備が進んでいれば優先度 A 級',
        overview: '社内マニュアル・規定・FAQ を RAG 構成でベクトル DB に格納し、社員が自然言語で質問できる環境を構築。新人立ち上げ・属人化排除に効く。',
        flowBefore: '①新人が疑問発生\n②マニュアルを探す\n③見つからず先輩に質問\n④先輩の作業を中断\n⑤回答を口頭で受け取る',
        flowAfter: '①新人が AI に自然言語で質問\n②AI が該当マニュアルを引用付きで回答\n③回答精度を即時フィードバック\n④AI が学習・改善',
        prereq: 'マニュアル・規定の Markdown 化（既存ドキュメント整備）',
      },
      {
        area: '週次 KPI レポート生成',
        effect: '月 12 時間削減',
        effectBasis: '週 1 本 × 180 分/本 × 4 週 = 12h／実績: 担当者が複数ソース（freee・GA4・Supabase）から数値を集計し、コメント付きで作成していた工程。AI 自動生成 + 人確認 15 分/週に。',
        critical: '低 ── 社内資料のみで代替可',
        priority: '優先度 C（低）',
        priorityBasis: '削減効果中だが致命度低・既存 BI ツールで代替可。Phase2 末以降',
        overview: 'KPI データソース（会計・広告・サイト分析・CRM）から自動集計し、AI がコメント付き週次レポートを生成。経営会議の準備時間を圧縮。',
        flowBefore: '①各ツールから数値抽出\n②スプレッドシートに集約\n③グラフ作成\n④コメント執筆\n⑤Slack 投稿',
        flowAfter: '①AI がデータ自動集計\n②グラフ生成\n③前週比較コメント生成\n④担当が 15 分確認\n⑤自動 Slack 投稿',
        prereq: 'データ集約パイプライン',
      },
      {
        area: '事例記事ドラフト生成',
        effect: '月 8 時間削減',
        effectBasis: '月 4 本 × 120 分/本 = 8h（記事構成・初稿）／実績: マーケ担当 1 名が事例インタビューから記事化していた工程。インタビュー音声から AI が初稿を生成し、校正のみ人が担当。',
        critical: '低 ── マーケ用途で緊急度低',
        priority: '優先度 C（低）',
        priorityBasis: '効果額は中だが、緊急度低く Phase3 以降推奨',
        overview: 'お客様事例インタビューの音声を AI が文字起こし→要約→記事構成→初稿生成まで自動化。マーケ担当の負担を軽減し、事例公開ペースを上げる。',
        flowBefore: '①インタビュー録音\n②文字起こし\n③要点抽出\n④構成検討\n⑤本文執筆 (120 分)',
        flowAfter: '①インタビュー録音\n②AI が文字起こし + 要約 + 構成\n③AI が初稿生成\n④担当が校正 (30 分)\n⑤公開',
        prereq: '取材データの構造化',
      },
    ].flatMap((p, i) => [
      [`paid_proposal_area_${i+1}`, p.area],
      [`paid_proposal_effect_${i+1}`, p.effect],
      [`paid_proposal_effect_basis_${i+1}`, p.effectBasis],
      [`paid_proposal_critical_${i+1}`, p.critical],
      [`paid_proposal_priority_${i+1}`, p.priority],
      [`paid_proposal_priority_basis_${i+1}`, p.priorityBasis],
      [`paid_proposal_overview_${i+1}`, p.overview],
      [`paid_proposal_flow_before_${i+1}`, p.flowBefore || ''],
      [`paid_proposal_flow_after_${i+1}`, p.flowAfter || ''],
      [`paid_proposal_architecture_${i+1}`, p.architecture || ''],
      [`paid_proposal_prereq_${i+1}`, p.prereq],
    ])
  ),

  // フロー図 / アーキテクチャ図
  paid_flow_diagram_placeholder: '【業務フロー図 — Phase 2 で Mermaid 自動生成予定】\n受付 → 解析 → 一次回答ドラフト → 確認 → 送信',
  paid_architecture_diagram_placeholder: '【アーキテクチャ図 — Phase 2 で Mermaid 自動生成予定】\nフォーム → API → DB / AI モデル / 通知サービス',

  // ロードマップ
  // STEP 1: 最重要 1 件（提案 01 = 見積作成の半自動化）
  paid_roadmap_p1_actions: '・提案 01「見積作成の半自動化」を実装\n・単価 DB と AI 連携の基盤構築\n・社内運用フローの整備\n・効果計測ダッシュボードを並行構築',
  paid_roadmap_p1_kpi: '・見積作成時間 30 分 → 4 分／件\n・月 50 件処理で月 20h 削減\n・誤算出ゼロ件の維持',
  // STEP 2: 2 件目を追加（提案 02 = 顧客対応の一次回答自動化）
  paid_roadmap_p2_actions: '・提案 02「顧客対応の一次回答自動化」を追加\n・FAQ・過去対応の RAG 構築\n・STEP 1 の運用知見を反映\n・利用率モニタリング体制',
  paid_roadmap_p2_kpi: '・一次回答時間 4h → 30 分\n・FAQ ヒット率 80% 以上\n・社員の利用継続率',
  // 判断ポイント: 3 件目を導入するか検討
  paid_roadmap_p3_actions: '・STEP 1-2 の効果実績を確認\n・3 件目候補（提案 03 議事録要約）の必要性を判断\n・必要なら追加実装、不要なら運用最適化に集中',
  paid_roadmap_p3_kpi: '・STEP 1-2 で月 30h 削減を達成しているか\n・社員の AI 運用が定着しているか\n・3 件目に投資するだけの ROI 見込みがあるか',

  // ROI 詳細（月額のみ。スケール時の累計試算は提示しない方針）
  paid_roi_total_yen: '186,000',
  ...Object.fromEntries(
    [
      ['顧客対応の一次回答自動化', 10, '15,000'],
      ['事例記事ドラフト生成', 8, '12,000'],
      ['見積作成の半自動化', 20, '30,000'],
      ['提案書ドラフト生成', 25, '37,500'],
      ['議事録要約', 15, '22,500'],
      ['週次レポート生成', 12, '18,000'],
      ['SNS投稿自動化', 8, '12,000'],
    ].flatMap((r, i) => [
      [`paid_roi_no_${i+1}`, `0${i+1}`],
      [`paid_roi_area_${i+1}`, r[0]],
      [`paid_roi_hours_${i+1}`, `${r[1]}h`],
      [`paid_roi_yen_${i+1}`, `¥${r[2]}`],
      [`paid_roi_basis_${i+1}`, `想定 ${r[1] * 4}件/月 × 削減15分`],
    ])
  ),

  // ランニングコスト（月額）── 初期導入費用は MTG ヒアリング後に個別見積で別途提示
  // API 件数・監視運用の中身は明示する（CEO指示 2026-05-08）
  paid_cost_monthly_total: '¥18,000 〜 25,000',
  paid_cost_monthly_breakdown:
    '・データベース（Supabase Pro 等）: ¥3,000\n' +
    '・AI API 利用: ¥8,000 〜 12,000\n' +
    '  想定: 月 5,000 〜 10,000 リクエスト／月（軽量モデル中心、平均 1k〜2k トークン/件）\n' +
    '・クラウドサービス（Vercel ホスティング・ストレージ等）: ¥4,000\n' +
    '・監視・運用: ¥3,000 〜 6,000\n' +
    '  内訳: ログ・エラー監視／AI モデル更新への追従／月次の小規模プロンプト調整',

  // 具体サービス比較（優先度A 3提案の実装スタック）
  // 推奨 A は中小事業者向けに最適化された構成
  // 各セルは「サービス名 / 金額 / 特徴」を改行区切りで記載（2026-05時点の公開情報に基づく目安）
  ...Object.fromEntries(
    [
      // 1. データベース ＋ 認証
      [
        'Supabase Pro\n$25/月（約 ¥3,750）\nPostgres + Auth + Storage 一括。pgvector で RAG 構築可。',
        'Firebase（Blaze 従量制）\n無料〜従量制\nNoSQL ベース。スマホ・チャット型に強い。',
        'AWS RDS + Cognito\n$50〜/月＋設計コスト\nフルカスタマイズ可。運用負荷大。',
      ],
      // 2. LLM API
      [
        'Claude Haiku 4.5\n入力 $1 / 出力 $5（1M トークン）\n軽量・高速。月 5-10k リクエストで ¥1,500-3,000。日本語精度高い。',
        'GPT-4o mini\n入力 $0.15 / 出力 $0.60（1M）\n価格最安。コーディング系も強い。OpenAI エコシステム。',
        'Gemini 2.5 Flash\n入力 $0.075 / 出力 $0.30（1M）\nGoogle Workspace 統合。マルチモーダル対応。',
      ],
      // 3. 文字起こし API
      [
        'OpenAI Whisper API\n$0.006/分（約 ¥1）\n高精度・日本語対応・実装容易。月 20 会議×45分なら約 ¥900。',
        'AssemblyAI\n$0.37/時\n話者分離・要約・感情分析が一体型。多言語強い。',
        'Google Speech-to-Text v2\n$0.024/分\nGoogle Workspace 統合。リアルタイム文字起こし対応。',
      ],
      // 4. ホスティング ＋ サーバレス
      [
        'Vercel Pro\n$20/月（約 ¥3,000）\nAstro/Next.js 親和性高。Edge Functions・即時デプロイ。',
        'Cloudflare Workers\n無料〜従量制\n超低レイテンシ。グローバルエッジ展開。学習曲線あり。',
        'AWS Lambda + API Gateway\n従量制\nフルカスタム可。運用知識必須。',
      ],
    ].flatMap((row, i) => [
      [`paid_compare_${i+1}_a`, row[0]],
      [`paid_compare_${i+1}_b`, row[1]],
      [`paid_compare_${i+1}_c`, row[2]],
    ])
  ),

  // PoC計画
  // PoC 計画は v1.3 で削除（顧客は導入意思確定済の段階で来るため）
  // 効果計測はロードマップ STEP 1-2 の KPI で実施する

  // 補助金
  paid_subsidy_search_date: today,
  // 3 件のカードスタイル表（v1.3 で 4 行 → 3 行構成に変更）
  paid_subsidy_name_1: '小規模事業者持続化補助金（一般型）',
  paid_subsidy_period_1: '2026/4/1 〜 2026/6/30',
  paid_subsidy_amount_1: '50 万円',
  paid_subsidy_rate_1: '2/3',
  paid_subsidy_fit_1: '高',
  paid_subsidy_name_2: '事業再構築補助金',
  paid_subsidy_period_2: '2026 Q3 予定',
  paid_subsidy_amount_2: '1,500 万円',
  paid_subsidy_rate_2: '1/2',
  paid_subsidy_fit_2: '中',
  paid_subsidy_name_3: '人材開発支援助成金（人への投資促進コース）',
  paid_subsidy_period_3: '通年（随時）',
  paid_subsidy_amount_3: '年 1,000 万円',
  paid_subsidy_rate_3: '最大 75%',
  paid_subsidy_fit_3: '中',

  // リスク
  // リスクと対策（v1.3: ベンダーロックインは削除し 4 項目構成に）
  // 機密情報の取扱が高度に求められる場合はローカル LLM 運用を選択肢として提示
  paid_risk_name_1: '情報漏洩',
  paid_risk_impact_1: '高',
  paid_risk_likelihood_1: '中',
  paid_risk_mitigation_1: 'API 学習除外契約／監査ログ／権限管理。機密度が高い場合はローカル LLM 運用も検討',
  paid_risk_name_2: 'AI 依存（人的スキル低下）',
  paid_risk_impact_2: '中',
  paid_risk_likelihood_2: '中',
  paid_risk_mitigation_2: '定期スキル維持トレーニング・月次の手動運用テスト',
  paid_risk_name_3: '規制変更',
  paid_risk_impact_3: '低',
  paid_risk_likelihood_3: '中',
  paid_risk_mitigation_3: 'AI 事業者ガイドラインの定期チェック・運用への反映',
  paid_risk_name_4: '出力品質のばらつき',
  paid_risk_impact_4: '中',
  paid_risk_likelihood_4: '中',
  paid_risk_mitigation_4: 'バリデーション層・人間レビューフロー・サンプル監査',

  // コンプライアンス
  // AI事業者ガイドライン整合性は v1.4 で削除（/security ページに統合）

  // ===== Q&A: ご質問・関心事への回答（v1.5 追加） =====
  paid_user_concern_quote:
    '「AIで作った文章をそのまま顧客に送って大丈夫でしょうか。誤情報や失礼な表現が混じった場合の責任が気になります。あと、月額のランニングコストがどれくらいに収まるかも知りたいです。」',
  paid_user_concern_answer:
    '結論から申し上げると、AI 出力をそのまま外部に出す運用は推奨せず、御社の業務リスクに応じて 2 段の制御を入れます。\n' +
    '\n' +
    '【1】文章の品質・責任面: 顧客向けの一次返信は AI が下書き → 担当者が 1 クリック承認、というハーネス（前ページ「リスク対策」参照）で運用します。誤情報や失礼な表現は承認段階でフィルタされ、最終責任は人間に残ります。これにより「AI に出力を任せたから事故が起きた」という事態を構造的に防げます。\n' +
    '\n' +
    '【2】月額ランニングコスト: 御社の想定利用量（顧客対応・SNS下書き・社内問合せ対応）から試算すると、AI API 費用は <strong>月額 5,000〜15,000 円</strong> 程度、Supabase 等のクラウド基盤は <strong>月額 4,000〜7,000 円</strong> 程度、合計で <strong>月額 1〜2 万円のレンジに収まる見込み</strong>です（提案の「ランニングコスト試算」スライド参照）。\n' +
    '\n' +
    '機密情報の取扱が懸念される場合は、ローカル LLM 運用（GPU 設備または GPU クラウドレンタル）への切り替えで API 費用ゼロにする選択肢もご相談いただけます。',
};

// ===== 実行 =====
console.log(`\nテスト用 Slides 生成中...\n`);

const accessToken = await getGoogleToken();
console.log(`✓ Google OAuth Token 取得`);

// テンプレコピー
const copyRes = await fetch(
  `https://www.googleapis.com/drive/v3/files/${TEMPLATE_ID}/copy?supportsAllDrives=true`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `[TEST] Optiens AI診断 詳細版 - ${today}`,
      parents: [OUTPUT_FOLDER_ID],
    }),
  }
);
if (!copyRes.ok) throw new Error(`copy: ${await copyRes.text()}`);
const { id: newId } = await copyRes.json();
console.log(`✓ テンプレコピー完了: ${newId}`);

// プレースホルダー置換
const requests = Object.entries(SAMPLE).map(([key, val]) => ({
  replaceAllText: {
    containsText: { text: `{{${key}}}`, matchCase: true },
    replaceText: String(val),
  },
}));
console.log(`✓ プレースホルダー数: ${requests.length}`);

const updateRes = await fetch(
  `https://slides.googleapis.com/v1/presentations/${newId}:batchUpdate`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  }
);
if (!updateRes.ok) throw new Error(`batchUpdate: ${await updateRes.text()}`);
const updateResult = await updateRes.json();
console.log(`✓ batchUpdate 完了: ${(updateResult.replies || []).length} 件処理`);

// 共有設定
await fetch(`https://www.googleapis.com/drive/v3/files/${newId}/permissions?supportsAllDrives=true`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'anyone', role: 'reader' }),
});
console.log(`✓ 共有設定完了`);

console.log(`\n=================================================`);
console.log(`テスト用有償版レポート URL:`);
console.log(`https://docs.google.com/presentation/d/${newId}/edit`);
console.log(`=================================================`);
