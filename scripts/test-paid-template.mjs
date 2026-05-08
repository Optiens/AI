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

  // エグゼクティブサマリー
  paid_summary_value_yen: '186,000',
  paid_summary_hours: '124',
  paid_summary_period: '6ヶ月',
  paid_summary_initial: '450,000',
  paid_executive_summary: '小規模なIT支援事業者として、AI活用による業務自動化のポテンシャルが高い状況です。特に問い合わせ対応・提案書作成・見積作成の3領域で月間124時間の削減が見込まれ、月¥186,000の効果額換算となります。初期費用¥450,000で6ヶ月以内のフル運用化が現実的です。',

  // 現状分析
  paid_current_analysis_left: '従業員1名の小規模体制ながら、AI支援・水耕栽培・小説出版の3事業を展開。Webサイト運用、フォーム経由の問い合わせ対応、提案書作成、見積作成が中心業務。Google Workspace・Notion・freeeを活用済で、デジタル基盤は整備済。AI活用は組織的に活用中。',
  paid_current_analysis_right: '問い合わせ対応の一次回答に時間がかかる傾向。提案書・見積の作成は反復的だが個別調整が必要。レポート作成・議事録要約も時間消費要因。データ整備は良好だが、フォームから提案までのフローが手動でつながっている部分が多い。',

  // 提案 1-7
  ...Object.fromEntries(
    [
      ['顧客対応の一次回答自動化', '月10時間削減', 'A 高', 'FAQと過去対応データから一次回答ドラフトを自動生成。担当者は確認・調整のみ。', 'FAQ整備、過去対応データ50件以上'],
      ['事例記事ドラフト生成', '月8時間削減', 'A 高', 'インタビュー音声→要約→記事構成→ドラフト生成。校正は人間。', '取材データの構造化'],
      ['見積作成の半自動化', '月20時間削減', 'A 高', '要件入力→自動計算→AIが注意事項生成→PDF化。最終承認は人間。', '単価表・標準テンプレ整備'],
      ['提案書ドラフト生成', '月25時間削減', 'B 中', 'ヒアリング情報からテンプレに沿った提案書ドラフト自動生成。', 'テンプレートライブラリ'],
      ['議事録要約', '月15時間削減', 'B 中', 'Web会議録音→自動文字起こし→要点要約→アクション抽出。', '録音システム'],
      ['週次レポート生成', '月12時間削減', 'C 低', 'KPIデータから週次サマリーを自動生成。', 'データ集約パイプライン'],
      ['SNS投稿自動化', '月8時間削減', 'C 低', 'ブログ記事から要点抽出→SNS投稿フォーマット変換。', 'ブログ更新の継続'],
    ].flatMap((p, i) => [
      [`paid_proposal_area_${i+1}`, p[0]],
      [`paid_proposal_effect_${i+1}`, p[1]],
      [`paid_proposal_priority_${i+1}`, p[2]],
      [`paid_proposal_detail_${i+1}`, p[3]],
      [`paid_proposal_prereq_${i+1}`, p[4]],
    ])
  ),

  // フロー図 / アーキテクチャ図
  paid_flow_diagram_placeholder: '【業務フロー図 — Phase 2 で Mermaid 自動生成予定】\n受付 → 解析 → 一次回答ドラフト → 確認 → 送信',
  paid_architecture_diagram_placeholder: '【アーキテクチャ図 — Phase 2 で Mermaid 自動生成予定】\nフォーム → API → DB / AI モデル / 通知サービス',

  // ロードマップ
  paid_roadmap_p1_actions: '・問い合わせ対応の一次回答自動化PoC\n・データ収集パイプライン構築\n・運用体制の最小実装',
  paid_roadmap_p1_kpi: '一次回答時間\n4h → 30min',
  paid_roadmap_p2_actions: '・提案書/見積生成への展開\n・社内マニュアル整備\n・KPI可視化',
  paid_roadmap_p2_kpi: '主要業務カバー\n70%以上',
  paid_roadmap_p3_actions: '・SNS/レポート系へ拡張\n・データ品質向上\n・継続的最適化',
  paid_roadmap_p3_kpi: '月間効果額\n¥186,000達成',

  // ROI 詳細
  paid_roi_total_yen: '186,000',
  paid_roi_total_yen_12mo: '2,232,000',
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

  // コスト（2列構成: 初期 / ランニング。スケール時は提案フェーズ外のため除外）
  // 初期費用は純工数の約1.7倍（バッファ込み）。要件定義・データ移行・テンプレ実装をカスタム開発として一括計上
  paid_cost_init_total: '¥600,000',
  paid_cost_init_breakdown: '・カスタム開発: ¥600,000\n  （要件定義・データ移行・テンプレ実装含む）\n  ※ 工数ベース ¥350,000 × 1.7（バッファ込み）',
  paid_cost_monthly_total: '¥18,000〜25,000',
  paid_cost_monthly_breakdown: '・データベース: ¥3,000\n・API利用: ¥8,000-12,000\n・クラウドサービス: ¥4,000\n・監視・運用: ¥3,000-6,000',

  // ベンダー比較
  ...Object.fromEntries(
    [
      ['データベース', '〜¥3,000', '¥3,000-8,000', '¥8,000+'],
      ['AI推論モデル', '軽量', '中堅', '最上位'],
      ['認証・管理', 'OSS自前', 'SaaS', 'クラウドネイティブ'],
      ['インフラ', 'PaaS', 'マネージドK8s', 'マルチリージョン'],
      ['開発・運用', 'シンプル', '標準', 'エンタープライズ'],
    ].flatMap((row, i) => [
      [`paid_compare_${i+1}_a`, row[0]],
      [`paid_compare_${i+1}_b`, row[1]],
      [`paid_compare_${i+1}_c`, row[2]],
    ])
  ),

  // PoC計画
  paid_poc_purpose: '問い合わせ対応の一次回答自動化により、応答時間75%以上短縮を検証',
  paid_poc_target: '問い合わせフォーム → 一次回答ドラフト生成（FAQ参照型）',
  paid_poc_duration: '6週間（要件1週・開発2週・試験運用2週・評価1週）',
  paid_poc_success_criteria: '・回答時間 平均 4h → 30min 以内\n・回答精度 90%以上\n・担当者の手動修正率 30%以下',
  paid_poc_decision: 'PoC評価会で本番展開可否を決定。Go の場合 Phase 2 へ移行。',

  // 補助金
  paid_subsidy_search_date: today,
  paid_subsidy_name_1: '小規模事業者持続化補助金（一般型）',
  paid_subsidy_period_1: '2026/4/1〜2026/6/30',
  paid_subsidy_amount_1: '50万円',
  paid_subsidy_rate_1: '2/3',
  paid_subsidy_fit_1: '高',
  paid_subsidy_name_2: '事業再構築補助金',
  paid_subsidy_period_2: '2026/Q3予定',
  paid_subsidy_amount_2: '1500万円',
  paid_subsidy_rate_2: '1/2',
  paid_subsidy_fit_2: '中',
  paid_subsidy_name_3: '',
  paid_subsidy_period_3: '',
  paid_subsidy_amount_3: '',
  paid_subsidy_rate_3: '',
  paid_subsidy_fit_3: '',
  paid_subsidy_name_4: '',
  paid_subsidy_period_4: '',
  paid_subsidy_amount_4: '',
  paid_subsidy_rate_4: '',
  paid_subsidy_fit_4: '',

  // リスク
  paid_risk_name_1: '情報漏洩',
  paid_risk_impact_1: '高',
  paid_risk_likelihood_1: '中',
  paid_risk_mitigation_1: '機密情報の学習除外・監査ログ・権限管理',
  paid_risk_name_2: 'AI依存（人的スキル低下）',
  paid_risk_impact_2: '中',
  paid_risk_likelihood_2: '中',
  paid_risk_mitigation_2: '定期スキル維持トレーニング・手動運用テスト',
  paid_risk_name_3: 'ベンダーロックイン',
  paid_risk_impact_3: '中',
  paid_risk_likelihood_3: '低',
  paid_risk_mitigation_3: 'データポータビリティ確保・抽象化レイヤー',
  paid_risk_name_4: '規制変更',
  paid_risk_impact_4: '低',
  paid_risk_likelihood_4: '中',
  paid_risk_mitigation_4: 'AI事業者ガイドライン定期チェック',
  paid_risk_name_5: '出力品質のばらつき',
  paid_risk_impact_5: '中',
  paid_risk_likelihood_5: '中',
  paid_risk_mitigation_5: 'バリデーション層・人間レビューフロー',

  // コンプライアンス
  paid_compliance_transparency: '生成物にAI生成である旨を明示。出典・引用を記載。',
  paid_compliance_human_centric: '最終判断は人間が行う体制を維持。重要判断はAI単独不可。',
  paid_compliance_privacy: '個人情報はマスキング処理。学習データへの送信制御。',
  paid_compliance_security: '認証・暗号化・監査ログを標準実装。アクセス制御徹底。',
  paid_compliance_fairness: '出力品質の継続評価。バイアス検証を定期実施。',
  paid_compliance_accountability: '責任分担を契約書に明記。インシデント時の連絡フロー整備。',
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
