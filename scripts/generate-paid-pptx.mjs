/**
 * 有償版 詳細レポート PPTX テンプレ v1.5（19スライド・Q&Aセクション追加版）
 *
 * 設計書: executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md
 *
 * 構成:
 *  1. 表紙
 *  2. SECTION 01 エグゼクティブサマリー
 *  3. SECTION 02 御社の現状分析
 *  4. SECTION 03 提案概要（5〜7 件）
 *  5-N. SECTION 04 提案詳細
 *  N+1. SECTION 05 段階的導入ロードマップ
 *  N+2. SECTION 06 ROI 詳細試算
 *  N+3. SECTION 07 ランニングコスト試算（月額）
 *  N+4. SECTION 08 具体サービス比較
 *  N+5. SECTION 09 業種別補助金の該当性チェック
 *  N+6. SECTION 10 リスクアセスメント
 *  N+7. SECTION 11 ご質問・関心事への回答（NEW v1.5）
 *  N+8. SECTION 12 NEXT STEP
 *  N+9. 裏表紙
 *
 * プレースホルダー命名規則: {{paid_xxx}} （無料版と区別）
 * 新規プレースホルダー（v1.5）:
 *   - {{paid_user_concern_quote}}  : お客様のご質問引用
 *   - {{paid_user_concern_answer}} : Optiensからの回答（業務分析を踏まえた具体的方向性）
 *
 * 出力: tmp/optiens-diagnosis-paid-template-v1.0.pptx
 */
import pptxgen from 'pptxgenjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TMP_DIR = resolve(ROOT, 'tmp');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

const OUT_PATH = resolve(TMP_DIR, 'optiens-diagnosis-paid-template-v1.0.pptx');
const LOGO_PATH = resolve(ROOT, 'tmp/optiens-logo-small.png');
const COVER_IMG_PATH = resolve(ROOT, 'tmp/optiens-paid-cover.png');
const PREMIUM_BADGE_PATH = resolve(ROOT, 'tmp/optiens-premium-badge-trimmed.png');

// ===== ブランドカラー =====
const COLORS = {
  lapisDark: '152870',
  lapis: '1F3A93',
  lapisLight: '6B85C9',
  sakura: 'E48A95',
  sakuraSoft: 'FFCED0',
  sakuraBg: 'FCE4E7',
  text: '0F172A',
  textMuted: '475569',
  caption: '94A3B8',
  cardBg: 'F9FAFB',
  border: 'E5E7EB',
  white: 'FFFFFF',
  // 優先度バッジ用
  priorityHigh: '10B981',  // 緑
  priorityMid: 'F59E0B',   // 黄
  priorityLow: '94A3B8',   // 灰
};

const FONT_JP = 'Noto Sans JP';
const FONT_EN = 'Inter';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'Optiens 詳細AI活用診断レポート テンプレ v1.0';
pres.company = '合同会社Optiens';
pres.subject = '詳細AI活用診断レポート';
pres.author = 'Optiens';

const W = 13.333;
const H = 7.5;
const TOTAL = 19;

// ===== 共通要素 =====
function addCommonElements(slide, pageNum) {
  slide.addImage({ path: LOGO_PATH, x: 0.4, y: 0.3, w: 1.0, h: 0.35 });
  slide.addText(
    `${String(pageNum).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`,
    { x: W - 1.3, y: H - 0.45, w: 1.0, h: 0.25, fontSize: 9, color: COLORS.caption, fontFace: FONT_EN, align: 'right' }
  );
  slide.addText('optiens.com', {
    x: 0.4, y: H - 0.45, w: 2.0, h: 0.25,
    fontSize: 9, color: COLORS.caption, fontFace: FONT_EN, italic: true,
  });
}

function addFooterNote(slide, text) {
  slide.addText(text, {
    x: 2.5, y: H - 0.45, w: W - 5, h: 0.25,
    fontSize: 9, color: COLORS.caption, fontFace: FONT_JP, italic: true, align: 'center', valign: 'middle',
  });
}

function addGradientLine(slide, y) {
  slide.addShape('rect', { x: 0.6, y, w: 6.0, h: 0.04, fill: { color: COLORS.lapis }, line: { width: 0 } });
  slide.addShape('rect', { x: 6.6, y, w: 6.0, h: 0.04, fill: { color: COLORS.sakura }, line: { width: 0 } });
}

function addEyebrow(slide, text, y = 0.95) {
  slide.addText(text, {
    x: 0.6, y, w: 8, h: 0.3,
    fontSize: 11, color: COLORS.lapis, fontFace: FONT_EN, bold: true, charSpacing: 8,
  });
}

function addTitle(slide, text, y = 1.3) {
  slide.addText(text, {
    x: 0.6, y, w: 12, h: 0.8,
    fontSize: 32, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true,
  });
}

// =================================================
// Slide 1: 表紙（フルブリード画像 + 上層テキストオーバーレイ）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };

  // フルブリード画像を上下中央に配置（左から始まり画面右端まで）
  // 画像のアスペクト比 1:1（1024x1024）→ 高さ7.5、幅は7.5に。右側に配置
  // 左 5.83 inch がテキスト＆余白領域、右 7.5 inch が画像
  slide.addImage({
    path: COVER_IMG_PATH,
    x: W - 7.5, y: 0, w: 7.5, h: 7.5,
  });

  // 画像の左端に縦のラピス帯（テキストエリアと画像の境界・橋渡し）
  slide.addShape('rect', {
    x: W - 7.5, y: 0, w: 0.06, h: H,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });

  // テキスト領域: 画像の左側（白背景・余白）
  // 上から: ロゴ → PREMIUMバッジ → タイトル → 仕切り → 顧客名 → 発行日 → フッター

  // ロゴ（左上・拡大）
  slide.addImage({ path: LOGO_PATH, x: 0.6, y: 0.7, w: 2.3, h: 0.8 });

  // 【有償版】小サブラベル（ロゴ下・控えめ）
  slide.addText('【有償版】', {
    x: 0.65, y: 1.6, w: 2.5, h: 0.32,
    fontSize: 13, color: COLORS.sakura, fontFace: FONT_JP, bold: true,
    charSpacing: 6,
  });

  // メインタイトル（2行・上に寄せて余白バランス調整）
  slide.addText('AI活用診断', {
    x: 0.6, y: 2.5, w: 5.2, h: 0.85,
    fontSize: 42, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true,
  });
  slide.addText('詳細レポート', {
    x: 0.6, y: 3.3, w: 5.2, h: 0.85,
    fontSize: 42, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true,
  });

  // 装飾線
  slide.addShape('rect', {
    x: 0.6, y: 4.35, w: 4, h: 0.04,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  slide.addShape('rect', {
    x: 4.6, y: 4.35, w: 0.6, h: 0.04,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });

  // 顧客名
  slide.addText('{{paid_customer_name}} 様', {
    x: 0.6, y: 4.6, w: 5.2, h: 0.6,
    fontSize: 22, color: COLORS.text, fontFace: FONT_JP,
  });

  // 発行日
  slide.addText('発行日 {{paid_diagnosis_date}}', {
    x: 0.6, y: 5.25, w: 5.2, h: 0.3,
    fontSize: 12, color: COLORS.textMuted, fontFace: FONT_JP,
  });

  // 左下フッター（最下部）
  slide.addText('合同会社 Optiens', {
    x: 0.6, y: H - 0.95, w: 5.2, h: 0.3,
    fontSize: 12, color: COLORS.caption, fontFace: FONT_JP, bold: true,
  });
  slide.addText('optiens.com', {
    x: 0.6, y: H - 0.6, w: 5.2, h: 0.3,
    fontSize: 10, color: COLORS.caption, fontFace: FONT_EN,
  });
}

// =================================================
// Slide 2: エグゼクティブサマリー（実装施策3つ + 4ボックス）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 2);
  addEyebrow(slide, 'SECTION 01 / EXECUTIVE SUMMARY');
  addTitle(slide, 'エグゼクティブサマリー');
  addGradientLine(slide, 2.15);

  // ===== 上段: 実装する3つの施策 =====
  slide.addText('実装する 3 つの施策', {
    x: 0.6, y: 2.4, w: 12.1, h: 0.4,
    fontSize: 14, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
  });

  const initCards = [
    { num: '01', titleKey: 'paid_initiative_1_title', descKey: 'paid_initiative_1_desc' },
    { num: '02', titleKey: 'paid_initiative_2_title', descKey: 'paid_initiative_2_desc' },
    { num: '03', titleKey: 'paid_initiative_3_title', descKey: 'paid_initiative_3_desc' },
  ];

  const initCardW = 4.06;
  const initCardH = 1.35;
  const initCardY = 2.85;
  const initStartX = 0.45;
  const initGap = 0.18;

  initCards.forEach((c, i) => {
    const x = initStartX + (initCardW + initGap) * i;
    slide.addShape('roundRect', {
      x, y: initCardY, w: initCardW, h: initCardH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.lapisLight, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(c.num, {
      x: x + 0.2, y: initCardY + 0.1, w: 0.7, h: 0.3,
      fontSize: 14, color: COLORS.sakura, fontFace: FONT_EN, bold: true,
    });
    slide.addText(`{{${c.titleKey}}}`, {
      x: x + 0.2, y: initCardY + 0.4, w: initCardW - 0.4, h: 0.35,
      fontSize: 13, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true,
    });
    slide.addText(`{{${c.descKey}}}`, {
      x: x + 0.2, y: initCardY + 0.78, w: initCardW - 0.4, h: 0.5,
      fontSize: 10, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
  });

  // ===== 下段: 3つの数字ボックス（初期費用は MTG 後の個別見積で別途提示） =====
  const boxW = 4.0;
  const boxH = 1.45;
  const boxY = 4.45;
  const gap = 0.2;
  const totalBoxW = boxW * 3 + gap * 2;
  const startX = (W - totalBoxW) / 2;

  const boxes = [
    { label: '月間効果額', value: '¥{{paid_summary_value_yen}}', sub: '想定削減コスト' },
    { label: '月間削減時間', value: '{{paid_summary_hours}} 時間', sub: '従業員工数換算' },
    { label: '実装期間', value: '{{paid_summary_period}}', sub: 'STEP 1 + STEP 2 想定' },
  ];

  boxes.forEach((b, i) => {
    const x = startX + (boxW + gap) * i;
    slide.addShape('roundRect', {
      x, y: boxY, w: boxW, h: boxH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.lapis, width: 1.5 },
      rectRadius: 0.12,
    });
    slide.addText(b.label, {
      x: x + 0.2, y: boxY + 0.1, w: boxW - 0.4, h: 0.28,
      fontSize: 11, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center',
    });
    slide.addText(b.value, {
      x: x + 0.2, y: boxY + 0.4, w: boxW - 0.4, h: 0.65,
      fontSize: 22, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle',
    });
    slide.addText(b.sub, {
      x: x + 0.2, y: boxY + 1.07, w: boxW - 0.4, h: 0.28,
      fontSize: 9, color: COLORS.caption, fontFace: FONT_JP, align: 'center',
    });
  });

  // 要旨テキスト（短く下部に）
  slide.addText('{{paid_executive_summary}}', {
    x: 0.6, y: 6.05, w: 12.1, h: 0.7,
    fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
  });

  addFooterNote(slide, '※ 各施策の詳細は SECTION 03 以降をご参照ください');
}

// =================================================
// Slide 3: 御社の現状分析
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 3);
  addEyebrow(slide, 'SECTION 02 / 現状分析');
  addTitle(slide, '御社の現状分析');
  addGradientLine(slide, 2.15);

  // 業務分布カテゴリー（左カラム）
  slide.addShape('roundRect', {
    x: 0.6, y: 2.65, w: 5.95, h: 4.05,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border, width: 1 },
    rectRadius: 0.15,
  });
  slide.addShape('rect', {
    x: 0.6, y: 2.65, w: 5.95, h: 0.6,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  slide.addText('業務特性のサマリー', {
    x: 0.8, y: 2.65, w: 5.55, h: 0.6,
    fontSize: 20, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
  });
  slide.addText('{{paid_current_analysis_left}}', {
    x: 0.85, y: 3.4, w: 5.45, h: 3.15,
    fontSize: 16, color: COLORS.text, fontFace: FONT_JP, valign: 'top', paraSpaceAfter: 6,
  });

  // ボトルネック詳細（右カラム）
  slide.addShape('roundRect', {
    x: 6.75, y: 2.65, w: 5.95, h: 4.05,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.sakura, width: 1 },
    rectRadius: 0.15,
  });
  slide.addShape('rect', {
    x: 6.75, y: 2.65, w: 5.95, h: 0.6,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });
  slide.addText('ボトルネックと改善余地', {
    x: 6.95, y: 2.65, w: 5.55, h: 0.6,
    fontSize: 20, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
  });
  slide.addText('{{paid_current_analysis_right}}', {
    x: 7.0, y: 3.4, w: 5.45, h: 3.15,
    fontSize: 16, color: COLORS.text, fontFace: FONT_JP, valign: 'top', paraSpaceAfter: 6,
  });

  addFooterNote(slide, '※ フォーム入力と業界動向データから生成された分析です');
}

// =================================================
// Slides 4-5: AI活用提案（最大7件・3+4の2スライド）
// =================================================
function addProposalSlide(slideNum, eyebrowText, titleText, startIdx, count) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, slideNum);
  addEyebrow(slide, eyebrowText);
  addTitle(slide, titleText);
  addGradientLine(slide, 2.15);

  const cardW = (W - 1.4 - 0.3 * (count - 1)) / count;
  const cardH = 4.55;
  const cardY = 2.4;
  const startX = 0.7;
  const gap = 0.3;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const x = startX + (cardW + gap) * i;

    slide.addShape('roundRect', {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.15,
    });

    // 番号バッジ
    slide.addShape('roundRect', {
      x: x + 0.25, y: cardY + 0.22, w: 0.7, h: 0.5,
      fill: { color: COLORS.lapis }, line: { width: 0 },
      rectRadius: 0.08,
    });
    slide.addText(`0${idx}`, {
      x: x + 0.25, y: cardY + 0.22, w: 0.7, h: 0.5,
      fontSize: 18, color: COLORS.white, fontFace: FONT_EN, bold: true, align: 'center', valign: 'middle',
    });

    // 優先度バッジ（右上・大きく）
    slide.addText(`{{paid_proposal_priority_${idx}}}`, {
      x: x + cardW - 1.85, y: cardY + 0.27, w: 1.6, h: 0.4,
      fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'right', valign: 'middle',
    });

    // 業務名（タイトル）
    slide.addText(`{{paid_proposal_area_${idx}}}`, {
      x: x + 0.25, y: cardY + 0.82, w: cardW - 0.5, h: 0.6,
      fontSize: 17, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'top',
    });

    // 削減時間（メイン値・強調）
    slide.addText(`{{paid_proposal_effect_${idx}}}`, {
      x: x + 0.25, y: cardY + 1.5, w: cardW - 0.5, h: 0.45,
      fontSize: 16, color: COLORS.sakura, fontFace: FONT_JP, bold: true, valign: 'top',
    });

    // 削減根拠（新規・小さめ）
    slide.addText(`削減根拠: {{paid_proposal_effect_basis_${idx}}}`, {
      x: x + 0.25, y: cardY + 1.97, w: cardW - 0.5, h: 0.5,
      fontSize: 11, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'top',
    });

    // 致命度（新規）
    slide.addText(`致命度: {{paid_proposal_critical_${idx}}}`, {
      x: x + 0.25, y: cardY + 2.5, w: cardW - 0.5, h: 0.35,
      fontSize: 12, color: COLORS.text, fontFace: FONT_JP, bold: true, valign: 'top',
    });

    // 詳細
    slide.addText(`{{paid_proposal_detail_${idx}}}`, {
      x: x + 0.25, y: cardY + 2.9, w: cardW - 0.5, h: 0.7,
      fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });

    // 優先度根拠（新規・斜体）
    slide.addText(`優先度根拠: {{paid_proposal_priority_basis_${idx}}}`, {
      x: x + 0.25, y: cardY + 3.65, w: cardW - 0.5, h: 0.5,
      fontSize: 11, color: COLORS.lapis, fontFace: FONT_JP, italic: true, valign: 'top',
    });

    // 前提条件
    slide.addText(`前提: {{paid_proposal_prereq_${idx}}}`, {
      x: x + 0.25, y: cardY + cardH - 0.45, w: cardW - 0.5, h: 0.4,
      fontSize: 11, color: COLORS.textMuted, fontFace: FONT_JP, italic: true, valign: 'top',
    });
  }

  return slide;
}

// =================================================
// 1 提案 = 1 ページの詳細スライド関数
// includeFlowAndArch=true: 優先度A 用フル版（業務フロー + システム構成図）
// includeFlowAndArch=false: 優先度B/C 用コンパクト版
// =================================================
function addProposalDetailSlide(slideNum, idx, totalCount, includeFlowAndArch) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, slideNum);
  addEyebrow(slide, `SECTION 03 / AI活用提案 (${idx}/${totalCount})`);

  // 番号バッジ + 業務名（タイトル位置）
  slide.addShape('roundRect', {
    x: 0.6, y: 1.25, w: 1.0, h: 0.75,
    fill: { color: COLORS.lapis }, line: { width: 0 },
    rectRadius: 0.1,
  });
  slide.addText(`0${idx}`, {
    x: 0.6, y: 1.25, w: 1.0, h: 0.75,
    fontSize: 28, color: COLORS.white, fontFace: FONT_EN, bold: true, align: 'center', valign: 'middle',
  });
  slide.addText(`{{paid_proposal_area_${idx}}}`, {
    x: 1.75, y: 1.25, w: W - 2.35, h: 0.75,
    fontSize: 26, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'middle',
  });

  addGradientLine(slide, 2.1);

  // KPI 3ボックス（優先度・削減時間・致命度）
  const kpiY = 2.3;
  const kpiH = 0.8;
  const kpiW = 4.0;
  const kpiGap = 0.2;
  const kpiStartX = (W - kpiW * 3 - kpiGap * 2) / 2;
  const kpis = [
    { label: '優先度', valueKey: `paid_proposal_priority_${idx}` },
    { label: '削減時間', valueKey: `paid_proposal_effect_${idx}` },
    { label: '致命度', valueKey: `paid_proposal_critical_${idx}` },
  ];
  kpis.forEach((k, j) => {
    const kx = kpiStartX + (kpiW + kpiGap) * j;
    slide.addShape('roundRect', {
      x: kx, y: kpiY, w: kpiW, h: kpiH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.lapis, width: 1.5 },
      rectRadius: 0.1,
    });
    slide.addText(k.label, {
      x: kx + 0.2, y: kpiY + 0.08, w: kpiW - 0.4, h: 0.26,
      fontSize: 12, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });
    slide.addText(`{{${k.valueKey}}}`, {
      x: kx + 0.2, y: kpiY + 0.36, w: kpiW - 0.4, h: 0.4,
      fontSize: 15, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'top',
    });
  });

  if (includeFlowAndArch) {
    // ===== 優先度A: フル版（概要 + 業務フロー + システム構成 + 削減根拠） =====

    // 概要
    let secY = 3.25;
    slide.addText('概要', {
      x: 0.6, y: secY, w: W - 1.2, h: 0.28,
      fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });
    slide.addText(`{{paid_proposal_overview_${idx}}}`, {
      x: 0.6, y: secY + 0.3, w: W - 1.2, h: 0.55,
      fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });

    // 業務フロー（Before/After 2カラム）
    secY = 4.2;
    slide.addText('業務フロー', {
      x: 0.6, y: secY, w: W - 1.2, h: 0.28,
      fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });
    const flowY = secY + 0.3;
    const flowH = 1.25;
    const flowW = (W - 1.2 - 0.45) / 2;
    slide.addShape('roundRect', {
      x: 0.6, y: flowY, w: flowW, h: flowH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.textMuted, width: 1 },
      rectRadius: 0.08,
    });
    slide.addText('現状', {
      x: 0.75, y: flowY + 0.08, w: flowW - 0.3, h: 0.26,
      fontSize: 10, color: COLORS.textMuted, fontFace: FONT_JP, bold: true,
    });
    slide.addText(`{{paid_proposal_flow_before_${idx}}}`, {
      x: 0.75, y: flowY + 0.36, w: flowW - 0.3, h: flowH - 0.45,
      fontSize: 10, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
    slide.addText('→', {
      x: 0.6 + flowW + 0.025, y: flowY, w: 0.4, h: flowH,
      fontSize: 22, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle',
    });
    const afterX = 0.6 + flowW + 0.45;
    slide.addShape('roundRect', {
      x: afterX, y: flowY, w: flowW, h: flowH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.lapis, width: 1.5 },
      rectRadius: 0.08,
    });
    slide.addText('AI 導入後', {
      x: afterX + 0.15, y: flowY + 0.08, w: flowW - 0.3, h: 0.26,
      fontSize: 10, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });
    slide.addText(`{{paid_proposal_flow_after_${idx}}}`, {
      x: afterX + 0.15, y: flowY + 0.36, w: flowW - 0.3, h: flowH - 0.45,
      fontSize: 10, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });

    // システム構成（画像プレースホルダ）
    secY = flowY + flowH + 0.18;
    slide.addText('システム構成', {
      x: 0.6, y: secY, w: W - 1.2, h: 0.28,
      fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });
    slide.addShape('roundRect', {
      x: 0.6, y: secY + 0.3, w: W - 1.2, h: 0.95,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.border, width: 1, dashType: 'dash' },
      rectRadius: 0.08,
    });
    slide.addText(`{{paid_proposal_architecture_${idx}}}`, {
      x: 0.7, y: secY + 0.3, w: W - 1.4, h: 0.95,
      fontSize: 11, color: COLORS.text, fontFace: FONT_JP, align: 'center', valign: 'middle',
    });

    // 削減時間の根拠
    secY = secY + 1.3;
    slide.addText('削減時間の根拠', {
      x: 0.6, y: secY, w: W - 1.2, h: 0.28,
      fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });
    slide.addText(`{{paid_proposal_effect_basis_${idx}}}`, {
      x: 0.6, y: secY + 0.3, w: W - 1.2, h: 0.4,
      fontSize: 11, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
  } else {
    // ===== 優先度B/C: コンパクト版（概要 + 削減根拠） =====

    // 概要
    let secY = 3.4;
    slide.addText('概要', {
      x: 0.6, y: secY, w: W - 1.2, h: 0.32,
      fontSize: 14, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });
    slide.addText(`{{paid_proposal_overview_${idx}}}`, {
      x: 0.6, y: secY + 0.34, w: W - 1.2, h: 1.4,
      fontSize: 13, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });

    // 削減時間の根拠
    secY = 5.3;
    slide.addText('削減時間の根拠', {
      x: 0.6, y: secY, w: W - 1.2, h: 0.32,
      fontSize: 14, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });
    slide.addText(`{{paid_proposal_effect_basis_${idx}}}`, {
      x: 0.6, y: secY + 0.34, w: W - 1.2, h: 1.3,
      fontSize: 13, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
  }

  // フッター: 優先度根拠 + 前提
  addFooterNote(slide, `優先度根拠: {{paid_proposal_priority_basis_${idx}}}　／　前提: {{paid_proposal_prereq_${idx}}}`);
}

// Slides 4-10: AI活用提案 7案を1ページずつ詳細展開
// 優先度A（提案1-3）はフル版、優先度B/C（提案4-7）はコンパクト版
const PROPOSAL_TOTAL = 7;
const HIGH_PRIORITY_COUNT = 3;
for (let i = 1; i <= PROPOSAL_TOTAL; i++) {
  addProposalDetailSlide(3 + i, i, PROPOSAL_TOTAL, i <= HIGH_PRIORITY_COUNT);
}

// =================================================
// Slide 11: 段階的導入ロードマップ
// （旧「全体フロー図」「アーキテクチャ図」は優先度A 3提案ページに統合済のため削除）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 11);
  addEyebrow(slide, 'SECTION 05 / 導入ロードマップ');
  addTitle(slide, '段階的導入ロードマップ');
  addGradientLine(slide, 2.15);

  const phases = [
    {
      label: 'STEP 1', period: '〜 4 週間', name: '最重要 1 件を実装',
      color: COLORS.lapis, key: 'p1',
      isCheckpoint: false,
    },
    {
      label: 'STEP 2', period: '5〜8 週目', name: '2 件目を追加実装',
      color: COLORS.lapisLight, key: 'p2',
      isCheckpoint: false,
    },
    {
      label: '判断ポイント', period: '9 週目以降', name: '3 件目を導入するか検討',
      color: COLORS.sakura, key: 'p3',
      isCheckpoint: true,
    },
  ];

  const colW = 4.0;
  const colY = 2.65;
  const colH = 4.05;
  const startX = 0.65;
  const gap = 0.2;

  phases.forEach((p, i) => {
    const x = startX + (colW + gap) * i;

    slide.addShape('roundRect', {
      x, y: colY, w: colW, h: colH,
      fill: { color: COLORS.cardBg },
      line: { color: p.color, width: 2, dashType: p.isCheckpoint ? 'dash' : 'solid' },
      rectRadius: 0.15,
    });
    slide.addShape('rect', {
      x, y: colY, w: colW, h: 0.75,
      fill: { color: p.color }, line: { width: 0 },
    });
    slide.addText(p.label, {
      x: x + 0.2, y: colY + 0.05, w: colW - 0.4, h: 0.35,
      fontSize: 16, color: COLORS.white, fontFace: FONT_EN, bold: true, valign: 'top',
    });
    slide.addText(p.period, {
      x: x + 0.2, y: colY + 0.42, w: colW - 0.4, h: 0.3,
      fontSize: 12, color: COLORS.white, fontFace: FONT_JP, valign: 'top',
    });
    slide.addText(p.name, {
      x: x + 0.2, y: colY + 0.9, w: colW - 0.4, h: 0.5,
      fontSize: 16, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'top',
    });
    // 内容
    slide.addText(`{{paid_roadmap_${p.key}_actions}}`, {
      x: x + 0.2, y: colY + 1.5, w: colW - 0.4, h: 1.5,
      fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
    // 判断/KPI
    const kpiLabel = p.isCheckpoint ? '判断軸' : 'KPI / 確認事項';
    slide.addText(`【${kpiLabel}】\n{{paid_roadmap_${p.key}_kpi}}`, {
      x: x + 0.2, y: colY + 3.05, w: colW - 0.4, h: 0.95,
      fontSize: 11, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'top',
    });
  });

  addFooterNote(slide, '※ STEP 1-2 で効果を確認してから 3 件目を判断する慎重な進め方。AI 駆動開発で短期サイクルを実現');
}

// =================================================
// Slide 12: ROI 詳細試算
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 12);
  addEyebrow(slide, 'SECTION 06 / ROI 詳細試算');
  addTitle(slide, '月間効果額の詳細試算');
  addGradientLine(slide, 2.15);

  // 中央: 大数字（拡大）— 月額
  slide.addText('月 ¥{{paid_roi_total_yen}}', {
    x: 0, y: 2.3, w: W, h: 0.75,
    fontSize: 42, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center',
  });
  // 年間・3 年累計（小数字・横並び）
  slide.addText('年間効果額  ¥{{paid_roi_annual_yen}}', {
    x: 0.6, y: 3.05, w: (W - 1.2) / 2, h: 0.4,
    fontSize: 16, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center',
  });
  slide.addText('3 年累計  ¥{{paid_roi_three_year_yen}}', {
    x: 0.6 + (W - 1.2) / 2, y: 3.05, w: (W - 1.2) / 2, h: 0.4,
    fontSize: 16, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center',
  });

  // 内訳テーブル（最大7項目）
  const tableY = 3.55;
  const tableH = 3.45;
  slide.addShape('roundRect', {
    x: 0.6, y: tableY, w: W - 1.2, h: tableH,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border, width: 1 },
    rectRadius: 0.15,
  });

  // ヘッダ
  const headers = ['No.', '業務領域', '月間時間', '月間効果額', '算式根拠'];
  const colXs = [0.85, 1.4, 6.3, 7.85, 9.55];
  const colWs = [0.45, 4.85, 1.45, 1.65, 3.15];
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: colXs[i], y: tableY + 0.12, w: colWs[i], h: 0.4,
      fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'middle',
    });
  });

  // 項目行（最大7行）── 文字拡大
  const rowY = tableY + 0.6;
  const rowH = 0.4;
  for (let i = 1; i <= 7; i++) {
    const y = rowY + (i - 1) * rowH;
    slide.addText(`{{paid_roi_no_${i}}}`, { x: colXs[0], y, w: colWs[0], h: rowH, fontSize: 13, color: COLORS.lapis, fontFace: FONT_EN, bold: true, valign: 'middle' });
    slide.addText(`{{paid_roi_area_${i}}}`, { x: colXs[1], y, w: colWs[1], h: rowH, fontSize: 13, color: COLORS.text, fontFace: FONT_JP, valign: 'middle' });
    slide.addText(`{{paid_roi_hours_${i}}}`, { x: colXs[2], y, w: colWs[2], h: rowH, fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'right', valign: 'middle' });
    slide.addText(`{{paid_roi_yen_${i}}}`, { x: colXs[3], y, w: colWs[3], h: rowH, fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'right', valign: 'middle' });
    slide.addText(`{{paid_roi_basis_${i}}}`, { x: colXs[4], y, w: colWs[4], h: rowH, fontSize: 11, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'middle' });
  }

  addFooterNote(slide, '※ 標準時給 3,500 円ベース（事務職の時間単価＋機会損失込み）。月間効果額の試算（年間は月額×12、3年累計は×36）');
}

// =================================================
// Slide 13: ランニングコスト試算
// （初期導入費用は MTG ヒアリング後に個別見積として別途お渡しするため本スライドには含めない）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 13);
  addEyebrow(slide, 'SECTION 07 / ランニングコスト');
  addTitle(slide, 'ランニングコスト試算（月額）');
  addGradientLine(slide, 2.15);

  // 中央の単一カード（ランニング月額）
  const cardW = 9.0;
  const cardH = 3.4;
  const cardX = (W - cardW) / 2;
  const cardY = 2.65;

  slide.addShape('roundRect', {
    x: cardX, y: cardY, w: cardW, h: cardH,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.lapis, width: 2 },
    rectRadius: 0.15,
  });
  slide.addShape('rect', {
    x: cardX, y: cardY, w: cardW, h: 0.8,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  slide.addText('ランニング', {
    x: cardX + 0.3, y: cardY + 0.05, w: cardW - 0.6, h: 0.42,
    fontSize: 22, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'top',
  });
  slide.addText('月額（運用開始後）', {
    x: cardX + 0.3, y: cardY + 0.45, w: cardW - 0.6, h: 0.32,
    fontSize: 14, color: COLORS.white, fontFace: FONT_JP, valign: 'top',
  });
  // 大金額
  slide.addText('{{paid_cost_monthly_total}}', {
    x: cardX + 0.3, y: cardY + 1.0, w: cardW - 0.6, h: 0.9,
    fontSize: 36, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle',
  });
  // 内訳
  slide.addText('{{paid_cost_monthly_breakdown}}', {
    x: cardX + 0.5, y: cardY + 2.05, w: cardW - 1.0, h: 1.25,
    fontSize: 15, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
  });

  // 注記カード（初期費用について）
  const noteY = cardY + cardH + 0.25;
  slide.addShape('roundRect', {
    x: 0.6, y: noteY, w: W - 1.2, h: 0.55,
    fill: { color: 'F8FAFC' },
    line: { color: COLORS.border, width: 1 },
    rectRadius: 0.08,
  });
  slide.addText('初期導入費用は、MTG で実施対象を確定後に個別見積としてお渡しします。本レポートには含まれません。', {
    x: 0.8, y: noteY + 0.05, w: W - 1.6, h: 0.45,
    fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'middle',
  });

  addFooterNote(slide, '※ サービス構成・利用量により変動します。詳細は MTG にてご相談ください');
}

// =================================================
// Slide 14: 具体サービス比較（優先度A 3提案を実装するためのスタック）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 14);
  addEyebrow(slide, 'SECTION 08 / 具体サービス比較');
  addTitle(slide, '優先度A 3提案を実装するためのサービス比較');
  addGradientLine(slide, 2.15);

  // ヘッダ
  const headers = ['カテゴリ / 用途', '推奨 A', '選択肢 B', '選択肢 C'];
  const colXs = [0.6, 3.5, 6.8, 10.05];
  const colWs = [2.85, 3.25, 3.2, 3.2];

  // ヘッダ行
  slide.addShape('rect', {
    x: 0.6, y: 2.5, w: W - 1.2, h: 0.5,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: colXs[i] + 0.1, y: 2.5, w: colWs[i] - 0.2, h: 0.5,
      fontSize: 12, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle', align: i === 0 ? 'left' : 'center',
    });
  });

  // 4行（カテゴリ + 用途明示）
  const categories = [
    { name: 'データベース\n＋ 認証', use: '提案 01-03 共通基盤' },
    { name: 'LLM API', use: '提案 02 一次回答\n提案 03 議事録要約' },
    { name: '文字起こし API', use: '提案 03 議事録要約' },
    { name: 'ホスティング\n＋ サーバレス', use: '提案 01-03 共通' },
  ];
  const rowY = 3.0;
  const rowH = 1.05;

  categories.forEach((cat, i) => {
    const y = rowY + i * rowH;
    if (i % 2 === 0) {
      slide.addShape('rect', {
        x: 0.6, y, w: W - 1.2, h: rowH,
        fill: { color: COLORS.cardBg }, line: { width: 0 },
      });
    }
    // カテゴリ列
    slide.addText(cat.name, {
      x: colXs[0] + 0.12, y: y + 0.08, w: colWs[0] - 0.2, h: 0.5,
      fontSize: 12, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'top',
    });
    slide.addText(cat.use, {
      x: colXs[0] + 0.12, y: y + 0.55, w: colWs[0] - 0.2, h: 0.5,
      fontSize: 9, color: COLORS.textMuted, fontFace: FONT_JP, italic: true, valign: 'top',
    });
    // A/B/C 列（複数行可能なテキスト）
    ['a', 'b', 'c'].forEach((lvl, j) => {
      const isRecommended = lvl === 'a';
      slide.addText(`{{paid_compare_${i + 1}_${lvl}}}`, {
        x: colXs[j + 1] + 0.12, y: y + 0.08, w: colWs[j + 1] - 0.2, h: rowH - 0.16,
        fontSize: 10,
        color: isRecommended ? COLORS.text : COLORS.textMuted,
        fontFace: FONT_JP, valign: 'top',
        bold: isRecommended,
      });
    });
  });

  addFooterNote(slide, '※ 推奨A は中小事業者向けに最適化された構成。実装範囲・利用量により最終構成は MTG にて決定');
}

// =================================================
// Slide 15（旧 PoC 計画）── 削除済
// 削除理由: 顧客は AI 導入意思が確定済の段階で Optiens に来る。
// 検証フェーズではなく「導入＋効果計測」をロードマップ STEP 1-2 で実施するため、独立 PoC スライドは不要。
// 後続スライドのページ番号を -1 シフトした。
// =================================================

// =================================================
// Slide 15: 業種別補助金の該当性チェック
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 15);
  addEyebrow(slide, 'SECTION 09 / 補助金活用');
  addTitle(slide, '業種別補助金の該当性チェック');
  addGradientLine(slide, 2.15);

  // ヘッダ
  const headers = ['補助金名', '公募期間', '上限額', '補助率', '該当性'];
  const colXs = [0.7, 5.0, 7.4, 8.8, 10.4];
  const colWs = [4.2, 2.3, 1.3, 1.5, 2.3];

  slide.addShape('rect', {
    x: 0.6, y: 2.55, w: W - 1.2, h: 0.55,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: colXs[i], y: 2.55, w: colWs[i], h: 0.55,
      fontSize: 13, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
    });
  });

  // 3行（カードスタイル・空行は描画しない方針：データを必ず 3 件入れる前提）
  const rowY = 3.15;
  const rowH = 0.95;
  const rowGap = 0.12;
  for (let i = 1; i <= 3; i++) {
    const y = rowY + (i - 1) * (rowH + rowGap);
    slide.addShape('roundRect', {
      x: 0.6, y, w: W - 1.2, h: rowH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.08,
    });
    slide.addText(`{{paid_subsidy_name_${i}}}`, { x: colXs[0], y, w: colWs[0], h: rowH, fontSize: 14, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'middle' });
    slide.addText(`{{paid_subsidy_period_${i}}}`, { x: colXs[1], y, w: colWs[1], h: rowH, fontSize: 12, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'middle' });
    slide.addText(`{{paid_subsidy_amount_${i}}}`, { x: colXs[2], y, w: colWs[2], h: rowH, fontSize: 12, color: COLORS.text, fontFace: FONT_JP, bold: true, valign: 'middle' });
    slide.addText(`{{paid_subsidy_rate_${i}}}`, { x: colXs[3], y, w: colWs[3], h: rowH, fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'middle' });
    slide.addText(`{{paid_subsidy_fit_${i}}}`, { x: colXs[4], y, w: colWs[4], h: rowH, fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'middle' });
  }

  addFooterNote(slide, '※ 補助金情報は {{paid_subsidy_search_date}} 時点。最新公募は各補助金事務局でご確認ください。申請書作成・申請サポートは Optiens の業務範囲外（社労士・行政書士へご相談ください）。IT 導入補助金は対象外（Optiens は IT 導入支援事業者未登録のため）');
}

// =================================================
// Slide 16: リスクアセスメント
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 16);
  addEyebrow(slide, 'SECTION 10 / リスクアセスメント');
  addTitle(slide, 'リスクと対策');
  addGradientLine(slide, 2.15);

  // ヘッダ
  const headers = ['リスク', '影響', '発生可能性', '対策'];
  const colXs = [0.7, 4.6, 6.0, 7.5];
  const colWs = [3.8, 1.3, 1.4, 5.1];

  slide.addShape('rect', {
    x: 0.6, y: 2.55, w: W - 1.2, h: 0.55,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: colXs[i], y: 2.55, w: colWs[i], h: 0.55,
      fontSize: 13, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
      align: i === 1 || i === 2 ? 'center' : 'left',
    });
  });

  // 4 項目（ベンダーロックインは Optiens 方針上リスクとして扱わないため削除）
  const rowY = 3.15;
  const rowH = 0.78;
  const rowGap = 0.1;
  for (let i = 1; i <= 4; i++) {
    const y = rowY + (i - 1) * (rowH + rowGap);
    slide.addShape('roundRect', {
      x: 0.6, y, w: W - 1.2, h: rowH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.06,
    });
    slide.addText(`{{paid_risk_name_${i}}}`, { x: colXs[0], y, w: colWs[0], h: rowH, fontSize: 13, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'middle' });
    slide.addText(`{{paid_risk_impact_${i}}}`, { x: colXs[1], y, w: colWs[1], h: rowH, fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle' });
    slide.addText(`{{paid_risk_likelihood_${i}}}`, { x: colXs[2], y, w: colWs[2], h: rowH, fontSize: 13, color: COLORS.sakura, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle' });
    slide.addText(`{{paid_risk_mitigation_${i}}}`, { x: colXs[3], y, w: colWs[3], h: rowH, fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'middle' });
  }

  addFooterNote(slide, '※ 影響度・発生可能性は 高/中/低 の 3 段階で評価。機密情報の取扱が懸念される場合はローカル LLM 運用（高性能 PC への設備投資）も選択肢');
}

// =================================================
// Slide 17: ご質問・関心事への回答（フォーム自由記述「気になっていること」への個別回答）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 17);
  addEyebrow(slide, 'SECTION 11 / Q&A');
  addTitle(slide, 'ご質問・関心事への回答');
  addGradientLine(slide, 2.15);

  // リード文
  slide.addText(
    'お申し込みフォーム「その他、気になっていること」にご記入いただいた内容に対する個別回答です。',
    {
      x: 0.7, y: 2.3, w: W - 1.4, h: 0.4,
      fontSize: 13, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'top',
    },
  );

  // ===== Q ブロック（お客様のご質問） =====
  const qY = 2.85;
  const qH = 1.5;

  slide.addShape('roundRect', {
    x: 0.6, y: qY, w: W - 1.2, h: qH,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.lapisLight, width: 1 },
    rectRadius: 0.10,
  });

  // Q バッジ
  slide.addShape('roundRect', {
    x: 0.85, y: qY + 0.25, w: 0.55, h: 0.55,
    fill: { color: COLORS.lapis },
    line: { width: 0 },
    rectRadius: 0.10,
  });
  slide.addText('Q', {
    x: 0.85, y: qY + 0.25, w: 0.55, h: 0.55,
    fontSize: 22, color: COLORS.white, fontFace: FONT_EN, bold: true, align: 'center', valign: 'middle',
  });

  slide.addText('お客様のご質問・ご関心事', {
    x: 1.6, y: qY + 0.2, w: W - 2.5, h: 0.32,
    fontSize: 11, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'top',
  });
  slide.addText('{{paid_user_concern_quote}}', {
    x: 1.6, y: qY + 0.55, w: W - 2.5, h: qH - 0.7,
    fontSize: 14, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    italic: true,
  });

  // ===== A ブロック（Optiensからの回答） =====
  const aY = qY + qH + 0.3;
  const aH = 6.55 - aY - 0.1; // フッター余白を残す

  slide.addShape('roundRect', {
    x: 0.6, y: aY, w: W - 1.2, h: aH,
    fill: { color: COLORS.white },
    line: { color: COLORS.sakura, width: 1.5 },
    rectRadius: 0.10,
  });

  // A バッジ
  slide.addShape('roundRect', {
    x: 0.85, y: aY + 0.25, w: 0.55, h: 0.55,
    fill: { color: COLORS.sakura },
    line: { width: 0 },
    rectRadius: 0.10,
  });
  slide.addText('A', {
    x: 0.85, y: aY + 0.25, w: 0.55, h: 0.55,
    fontSize: 22, color: COLORS.white, fontFace: FONT_EN, bold: true, align: 'center', valign: 'middle',
  });

  slide.addText('Optiens からの回答', {
    x: 1.6, y: aY + 0.2, w: W - 2.5, h: 0.32,
    fontSize: 11, color: COLORS.sakura, fontFace: FONT_JP, bold: true, valign: 'top',
  });
  slide.addText('{{paid_user_concern_answer}}', {
    x: 1.6, y: aY + 0.55, w: W - 2.5, h: aH - 1.05,
    fontSize: 13, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
  });

  // 補足（MTG誘導）
  slide.addShape('roundRect', {
    x: 1.6, y: aY + aH - 0.55, w: W - 2.5, h: 0.45,
    fill: { color: 'F8FAFC' },
    line: { color: COLORS.border, width: 1 },
    rectRadius: 0.06,
  });
  slide.addText(
    '🎯 さらに具体的なご相談は、レポート同梱の 60 分オンライン MTG にてお受けします。',
    {
      x: 1.7, y: aY + aH - 0.55, w: W - 2.7, h: 0.45,
      fontSize: 12, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'middle',
    },
  );

  addFooterNote(slide, '※ ご記入が任意のフィールドのため、自由記述がない場合は本ページは省略されます');
}

// =================================================
// Slide 17（旧 AI事業者ガイドライン整合性）── 削除済
// 削除理由: 有償版レポートに載せる内容として適切でない（コンプライアンス情報は会社情報の領域）
// 統合先: ウェブサイト /security ページ（情報セキュリティ方針）に AI事業者ガイドライン整合性セクションを追加
// 後続スライドのページ番号を -1 シフトした。
// =================================================

// =================================================
// Slide 18: 次のステップ
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 18);
  addEyebrow(slide, 'SECTION 12 / NEXT STEP');
  addTitle(slide, '導入支援への次のステップ');
  addGradientLine(slide, 2.15);

  // ステップ4列
  const steps = [
    { num: '01', label: '60 分 MTG', desc: '本レポートをもとに質疑応答・実施対象のすり合わせ・個別見積' },
    { num: '02', label: '導入支援契約', desc: '準委任契約（業務委託）として契約締結・体制構築・キックオフ' },
    { num: '03', label: '開発', desc: '優先度A の 1〜2 業務に絞り AI 駆動で短期実装（〜4 週間）' },
    { num: '04', label: '本番展開', desc: '主要業務へ展開・運用最適化・継続改善' },
  ];

  const stepW = (W - 1.2 - 0.3 * 3) / 4;
  const stepY = 2.55;
  const stepH = 3.85;

  steps.forEach((s, i) => {
    const x = 0.6 + (stepW + 0.3) * i;

    slide.addShape('roundRect', {
      x, y: stepY, w: stepW, h: stepH,
      fill: { color: COLORS.lapis },
      line: { width: 0 },
      rectRadius: 0.15,
    });
    slide.addText(s.num, {
      x: x + 0.2, y: stepY + 0.3, w: stepW - 0.4, h: 0.85,
      fontSize: 38, color: COLORS.sakuraSoft, fontFace: FONT_EN, bold: true, valign: 'top',
    });
    slide.addText(s.label, {
      x: x + 0.2, y: stepY + 1.3, w: stepW - 0.4, h: 0.6,
      fontSize: 19, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'top',
    });
    slide.addText(s.desc, {
      x: x + 0.2, y: stepY + 2.0, w: stepW - 0.4, h: stepH - 2.15,
      fontSize: 13, color: COLORS.white, fontFace: FONT_JP, valign: 'top',
    });
  });

  // 契約形態 + 補足カード
  slide.addShape('roundRect', {
    x: 0.6, y: 6.55, w: W - 1.2, h: 0.55,
    fill: { color: 'F8FAFC' },
    line: { color: COLORS.lapis, width: 1 },
    rectRadius: 0.08,
  });
  slide.addText(
    '導入支援契約は「準委任契約（業務委託）」として締結します。請負ではなく、業務遂行に責任を持つ契約形態です。',
    {
      x: 0.8, y: 6.55, w: W - 1.6, h: 0.55,
      fontSize: 13, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'middle',
    }
  );

  addFooterNote(slide, '※ 本レポート費用 ¥5,500 は導入支援契約の初期費用に全額充当');
}

// =================================================
// Slide 19: 裏表紙
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 19);

  slide.addText('ご質問・ご相談', {
    x: 0, y: 1.0, w: W, h: 0.8,
    fontSize: 32, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center',
  });

  slide.addShape('rect', { x: (W - 6) / 2, y: 2.0, w: 3, h: 0.05, fill: { color: COLORS.lapis }, line: { width: 0 } });
  slide.addShape('rect', { x: W / 2, y: 2.0, w: 3, h: 0.05, fill: { color: COLORS.sakura }, line: { width: 0 } });

  slide.addText(
    [
      { text: '合同会社 Optiens\n', options: { fontSize: 22, bold: true, color: COLORS.text } },
      { text: '\n', options: { fontSize: 8 } },
      { text: 'Web:           ', options: { fontSize: 14, color: COLORS.textMuted } },
      { text: 'https://optiens.com\n', options: { fontSize: 14, color: COLORS.lapis, bold: true } },
      { text: 'お問い合わせ: ', options: { fontSize: 14, color: COLORS.textMuted } },
      { text: 'info@optiens.com', options: { fontSize: 14, color: COLORS.lapis, bold: true } },
    ],
    {
      x: 0, y: 2.4, w: W, h: 1.5,
      fontFace: FONT_JP, align: 'center', valign: 'top',
      paraSpaceBefore: 4, paraSpaceAfter: 4,
    }
  );

  // ブランドコピーカード
  slide.addShape('roundRect', {
    x: 2.0, y: 4.1, w: W - 4.0, h: 1.55,
    fill: { color: COLORS.sakuraBg },
    line: { color: COLORS.sakura, width: 1 },
    rectRadius: 0.15,
  });
  slide.addText(
    [
      { text: '本レポートは AI による自動生成です。\n', options: { fontSize: 14, bold: true, color: COLORS.text } },
      { text: '人間が作業する場合は5日、AIなら5分で完結します。\n\n', options: { fontSize: 14, color: COLORS.text } },
      { text: '同じ仕組みを御社に合わせた内容でご提供できますので、お気軽にご相談ください。', options: { fontSize: 13, color: COLORS.textMuted } },
    ],
    {
      x: 2.3, y: 4.25, w: W - 4.6, h: 1.3,
      fontFace: FONT_JP, align: 'center', valign: 'top',
      paraSpaceBefore: 4,
    }
  );

  slide.addImage({ path: LOGO_PATH, x: (W - 2.5) / 2, y: 6.0, w: 2.5, h: 0.85 });
}

await pres.writeFile({ fileName: OUT_PATH });
console.log(`✓ 有償版 PPTX v1.0 生成完了: ${OUT_PATH}`);
console.log(`  スライド数: ${TOTAL}`);
