/**
 * /service/sample-*.astro 12 ページに「関連デモ」セクションを追加
 * 各業種にマッチする実機デモへの導線を CTA セクション直前に挿入
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = resolve(__dirname, '../src/pages/service');

// 業種別 → 関連デモのマッピング
const DEMO_MAP = {
  'sample-legal.astro': {
    title: '士業に特に相性の良い実機デモ',
    demos: [
      { name: '社内ドキュメント検索', desc: '税法・規程・顧問先別ルールを自然言語で即引き出し', href: '/data-search' },
      { name: '書類自動読み取り', desc: '申告書類・領収書から項目を自動抽出', href: '/free-diagnosis' },
      { name: '承認ワークフロー', desc: '顧問先からの依頼を分類→担当所員へ自動振り分け', href: '/approval-workflow' },
    ],
  },
  'sample-pension.astro': {
    title: '宿泊業に特に相性の良い実機デモ',
    demos: [
      { name: '口コミ24h監視＋AI返信', desc: '楽天/じゃらん/Booking/Google マップを 24h 自動監視', href: '/review-monitor' },
      { name: '問い合わせ自動振り分け', desc: '多言語問い合わせを業務別に分類・一次返信下書き', href: '/inquiry-routing' },
      { name: '稼働状況ダッシュボード', desc: '予約状況・客単価・稼働率を一画面で把握', href: '/automation-dashboard' },
    ],
  },
  'sample-restaurant.astro': {
    title: 'カフェ・レストランに特に相性の良い実機デモ',
    demos: [
      { name: '口コミ24h監視＋AI返信', desc: '食べログ/Google マップ/Instagram の新着レビューを自動監視', href: '/review-monitor' },
      { name: '問い合わせ自動振り分け', desc: '予約変更・問合せ・クレームを分類して担当へ', href: '/inquiry-routing' },
      { name: '社内ドキュメント検索', desc: 'メニュー仕様・アレルギー対応情報を即引き出し', href: '/data-search' },
    ],
  },
  'sample-ec.astro': {
    title: 'EC・ネットショップに特に相性の良い実機デモ',
    demos: [
      { name: 'カスタム業務管理画面', desc: '受注・在庫・問い合わせを一画面で統合管理', href: '/document-editor' },
      { name: '自然言語データ検索', desc: '「先月の売れ筋カテゴリは？」と話しかけて即回答', href: '/data-search' },
      { name: '問い合わせ自動振り分け', desc: '配送遅延・返品・サイズ相談を分類して即対応', href: '/inquiry-routing' },
    ],
  },
  'sample-construction.astro': {
    title: '工務店・建設に特に相性の良い実機デモ',
    demos: [
      { name: '見積自動生成', desc: '案件情報を入力するだけで Markdown 見積書を生成', href: '/quote-generator' },
      { name: '承認ワークフロー', desc: '稟議・発注・契約承認を申請→承認の 2 画面で完結', href: '/approval-workflow' },
      { name: '書類自動読み取り', desc: '見積書・契約書・現場写真から情報を自動抽出', href: '/free-diagnosis' },
    ],
  },
  'sample-winery.astro': {
    title: 'ワイナリー・醸造所に特に相性の良い実機デモ',
    demos: [
      { name: '社内ドキュメント検索', desc: '醸造記録・テイスティングノート・取引先情報を即引き出し', href: '/data-search' },
      { name: '稼働状況ダッシュボード', desc: '発酵タンクの温度・在庫・出荷状況を一元監視', href: '/automation-dashboard' },
      { name: '問い合わせ自動振り分け', desc: '卸先・通販顧客・見学希望を担当へ自動分類', href: '/inquiry-routing' },
    ],
  },
  'sample-outdoor.astro': {
    title: 'アウトドアガイドに特に相性の良い実機デモ',
    demos: [
      { name: '問い合わせ自動振り分け', desc: '予約・装備相談・天候問合せを内容別に分類', href: '/inquiry-routing' },
      { name: '稼働状況ダッシュボード', desc: '予約状況・天候判断材料・装備在庫を一画面で', href: '/automation-dashboard' },
      { name: '口コミ24h監視＋AI返信', desc: 'Google マップ・SNS のツアー口コミを即時把握', href: '/review-monitor' },
    ],
  },
  'sample-bakery.astro': {
    title: 'ベーカリーに特に相性の良い実機デモ',
    demos: [
      { name: '自然言語データ検索', desc: '「先週の売れ筋は？」「来週の仕込み目安は？」を即回答', href: '/data-search' },
      { name: '稼働状況ダッシュボード', desc: '日次売上・廃棄ロス・人気商品を可視化', href: '/automation-dashboard' },
      { name: '口コミ24h監視＋AI返信', desc: 'Google マップ・SNS の評価を即時キャッチ', href: '/review-monitor' },
    ],
  },
  'sample-farmer.astro': {
    title: '個人農家に特に相性の良い実機デモ',
    demos: [
      { name: '稼働状況ダッシュボード', desc: 'ハウス温湿度・収穫量・出荷予定を一画面で監視', href: '/automation-dashboard' },
      { name: '社内ドキュメント検索', desc: '出荷先別ルール・栽培マニュアル・補助金要件を即引き出し', href: '/data-search' },
      { name: '問い合わせ自動振り分け', desc: 'SNS 直販・市場・卸先の問合せを分類', href: '/inquiry-routing' },
    ],
  },
  'sample-dairy.astro': {
    title: '酪農・畜産に特に相性の良い実機デモ',
    demos: [
      { name: '稼働状況ダッシュボード', desc: '個体活動量・乳量・飲水量・牛舎環境を一画面で監視', href: '/automation-dashboard' },
      { name: '社内ドキュメント検索', desc: '飼養記録・繁殖サイクル・薬剤履歴を即引き出し', href: '/data-search' },
      { name: '承認ワークフロー', desc: '飼料発注・獣医依頼の承認フローを自動化', href: '/approval-workflow' },
    ],
  },
  'sample-municipality.astro': {
    title: '自治体・市役所に特に相性の良い実機デモ',
    demos: [
      { name: '社内ドキュメント検索', desc: '条例・通達・住民マニュアルを職員が即引き出し', href: '/data-search' },
      { name: '問い合わせ自動振り分け', desc: '住民問合せを担当課へ自動振り分け＋一次回答', href: '/inquiry-routing' },
      { name: '書類自動読み取り', desc: '申請書類・議事録から自動抽出して台帳化', href: '/free-diagnosis' },
    ],
  },
  'sample-executive.astro': {
    title: '経営者向けの実機デモ',
    demos: [
      { name: '稼働状況ダッシュボード', desc: '事業状況・KPI・アラートを朝 5 分で一覧把握', href: '/automation-dashboard' },
      { name: '自然言語データ検索', desc: '「先月の改善ポイントは？」を経営者の言葉で直接質問', href: '/data-search' },
      { name: '承認ワークフロー', desc: '稟議・発注・契約の承認を経営者画面に集約', href: '/approval-workflow' },
    ],
  },
};

// 挿入する HTML テンプレート
function buildSection(config) {
  const cards = config.demos.map((d) => `
            <a href="${d.href}" class="related-demo-card">
              <div class="related-demo-head">
                <i class="fa-solid fa-circle-play"></i>
                <strong>${d.name}</strong>
              </div>
              <p>${d.desc}</p>
              <span class="related-demo-cta">デモを試す <i class="fa-solid fa-arrow-right"></i></span>
            </a>`).join('\n');

  return `
        <!-- 関連デモ（実機で体験できる機能） -->
        <section class="report-section related-demos light-section">
          <h2><i class="fa-solid fa-flask-vial"></i> ${config.title}</h2>
          <p class="related-demos-lede">下記の実機デモは <strong>API を消費しない事前応答型</strong> で、御社の業種文脈に近い動きをすぐ確認できます。</p>
          <div class="related-demos-grid">${cards}
          </div>
        </section>
`;
}

let updatedCount = 0;
for (const [filename, config] of Object.entries(DEMO_MAP)) {
  const path = join(dir, filename);
  let src;
  try {
    src = readFileSync(path, 'utf-8');
  } catch {
    console.log(`SKIP (not found): ${filename}`);
    continue;
  }

  if (src.includes('class="report-section related-demos')) {
    console.log(`SKIP (already added): ${filename}`);
    continue;
  }

  // CTA セクション（class="cta-section"）の直前に挿入
  const ctaIdx = src.indexOf('<section class="cta-section">');
  if (ctaIdx === -1) {
    console.log(`SKIP (no cta-section): ${filename}`);
    continue;
  }

  const before = src.slice(0, ctaIdx);
  const after = src.slice(ctaIdx);
  const newSrc = before + buildSection(config) + '\n    ' + after;

  writeFileSync(path, newSrc);
  console.log(`UPDATED: ${filename}`);
  updatedCount++;
}

console.log(`\nDone. ${updatedCount} files updated.`);
