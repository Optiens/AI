/**
 * 有償版 詳細レポート PPTX テンプレ v1.0（17スライド）
 *
 * 設計書: executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md
 *
 * 構成:
 * 1. 表紙
 * 2. エグゼクティブサマリー
 * 3. 御社の現状分析
 * 4-5. AI活用提案 5〜7件（詳細版）
 * 6. フロー図（業務手順）
 * 7. アーキテクチャ図（システム構成）
 * 8. 段階的導入ロードマップ
 * 9. ROI 詳細試算
 * 10. コスト試算（フェーズ別）
 * 11. ベンダー/サービスカテゴリ比較
 * 12. PoC 計画案
 * 13. 業種別補助金の該当性チェック
 * 14. リスクアセスメント
 * 15. AI事業者ガイドライン整合性
 * 16. 次のステップ
 * 17. 裏表紙
 *
 * プレースホルダー命名規則: {{paid_xxx}} （無料版と区別）
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
const TOTAL = 17;

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
// Slide 2: エグゼクティブサマリー（4ボックス）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 2);
  addEyebrow(slide, 'SECTION 01 / EXECUTIVE SUMMARY');
  addTitle(slide, 'エグゼクティブサマリー');
  addGradientLine(slide, 2.15);

  // 4つの数字ボックス（横並び）
  const boxW = 3.0;
  const boxH = 1.7;
  const boxY = 2.7;
  const startX = 0.45;
  const gap = 0.16;

  const boxes = [
    { label: '月間効果額', value: '¥{{paid_summary_value_yen}}', sub: '想定削減コスト' },
    { label: '月間削減時間', value: '{{paid_summary_hours}} 時間', sub: '従業員工数換算' },
    { label: '実装期間', value: '{{paid_summary_period}}', sub: '初期PoC〜本番' },
    { label: '初期費用', value: '¥{{paid_summary_initial}}', sub: '本費用は充当可' },
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
      x: x + 0.2, y: boxY + 0.15, w: boxW - 0.4, h: 0.3,
      fontSize: 11, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center',
    });
    slide.addText(b.value, {
      x: x + 0.2, y: boxY + 0.5, w: boxW - 0.4, h: 0.7,
      fontSize: 24, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle',
    });
    slide.addText(b.sub, {
      x: x + 0.2, y: boxY + 1.25, w: boxW - 0.4, h: 0.3,
      fontSize: 9, color: COLORS.caption, fontFace: FONT_JP, align: 'center',
    });
  });

  // 要旨テキスト
  slide.addText('{{paid_executive_summary}}', {
    x: 0.6, y: 4.7, w: 12.1, h: 1.9,
    fontSize: 14, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
  });

  addFooterNote(slide, '※ 詳細な数値根拠と算式は次ページ以降をご参照ください');
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
    x: 0.6, y: 2.65, w: 5.95, h: 0.5,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  slide.addText('業務特性のサマリー', {
    x: 0.8, y: 2.65, w: 5.55, h: 0.5,
    fontSize: 16, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
  });
  slide.addText('{{paid_current_analysis_left}}', {
    x: 0.8, y: 3.3, w: 5.55, h: 3.2,
    fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
  });

  // ボトルネック詳細（右カラム）
  slide.addShape('roundRect', {
    x: 6.75, y: 2.65, w: 5.95, h: 4.05,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.sakura, width: 1 },
    rectRadius: 0.15,
  });
  slide.addShape('rect', {
    x: 6.75, y: 2.65, w: 5.95, h: 0.5,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });
  slide.addText('ボトルネックと改善余地', {
    x: 6.95, y: 2.65, w: 5.55, h: 0.5,
    fontSize: 16, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
  });
  slide.addText('{{paid_current_analysis_right}}', {
    x: 6.95, y: 3.3, w: 5.55, h: 3.2,
    fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
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
  const cardH = 4.05;
  const cardY = 2.65;
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
      x: x + 0.25, y: cardY + 0.25, w: 0.65, h: 0.45,
      fill: { color: COLORS.lapis }, line: { width: 0 },
      rectRadius: 0.08,
    });
    slide.addText(`0${idx}`, {
      x: x + 0.25, y: cardY + 0.25, w: 0.65, h: 0.45,
      fontSize: 14, color: COLORS.white, fontFace: FONT_EN, bold: true, align: 'center', valign: 'middle',
    });

    // 優先度バッジ（右上）
    slide.addText(`{{paid_proposal_priority_${idx}}}`, {
      x: x + cardW - 1.1, y: cardY + 0.25, w: 0.85, h: 0.4,
      fontSize: 10, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle',
    });

    // 業務名
    slide.addText(`{{paid_proposal_area_${idx}}}`, {
      x: x + 0.25, y: cardY + 0.85, w: cardW - 0.5, h: 0.55,
      fontSize: 14, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'top',
    });

    // 効果（時間・金額）
    slide.addText(`{{paid_proposal_effect_${idx}}}`, {
      x: x + 0.25, y: cardY + 1.45, w: cardW - 0.5, h: 0.4,
      fontSize: 11, color: COLORS.sakura, fontFace: FONT_JP, bold: true, valign: 'top',
    });

    // 詳細
    slide.addText(`{{paid_proposal_detail_${idx}}}`, {
      x: x + 0.25, y: cardY + 1.9, w: cardW - 0.5, h: 1.4,
      fontSize: 10, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });

    // 前提条件
    slide.addText(`前提: {{paid_proposal_prereq_${idx}}}`, {
      x: x + 0.25, y: cardY + cardH - 0.65, w: cardW - 0.5, h: 0.55,
      fontSize: 9, color: COLORS.textMuted, fontFace: FONT_JP, italic: true, valign: 'top',
    });
  }

  return slide;
}

// Slide 4: 提案 1〜3
{
  const slide = addProposalSlide(4, 'SECTION 03 / AI活用提案 (1/2)', 'AI活用提案 — 優先度高', 1, 3);
  addFooterNote(slide, '※ 優先度は実装容易度 × インパクトで判定');
}

// Slide 5: 提案 4〜7
{
  const slide = addProposalSlide(5, 'SECTION 03 / AI活用提案 (2/2)', 'AI活用提案 — 段階導入', 4, 4);
  addFooterNote(slide, '※ Phase2 以降での実装を推奨する提案群');
}

// =================================================
// Slide 6: フロー図（業務手順）— 画像プレースホルダ
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 6);
  addEyebrow(slide, 'SECTION 04 / フロー図');
  addTitle(slide, '想定される業務フロー');
  addGradientLine(slide, 2.15);

  // 画像プレースホルダ（後で Edge Function が画像挿入）
  slide.addShape('roundRect', {
    x: 1.0, y: 2.65, w: W - 2.0, h: 4.05,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border, width: 1, dashType: 'dash' },
    rectRadius: 0.15,
  });
  slide.addText('{{paid_flow_diagram_placeholder}}', {
    x: 1.0, y: 2.65, w: W - 2.0, h: 4.05,
    fontSize: 14, color: COLORS.caption, fontFace: FONT_JP, align: 'center', valign: 'middle',
  });

  addFooterNote(slide, '※ 業務手順をフロー図で可視化（経営者・現場担当向け）');
}

// =================================================
// Slide 7: アーキテクチャ図 — 画像プレースホルダ
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 7);
  addEyebrow(slide, 'SECTION 04 / アーキテクチャ図');
  addTitle(slide, 'システム構成図');
  addGradientLine(slide, 2.15);

  slide.addShape('roundRect', {
    x: 1.0, y: 2.65, w: W - 2.0, h: 4.05,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border, width: 1, dashType: 'dash' },
    rectRadius: 0.15,
  });
  slide.addText('{{paid_architecture_diagram_placeholder}}', {
    x: 1.0, y: 2.65, w: W - 2.0, h: 4.05,
    fontSize: 14, color: COLORS.caption, fontFace: FONT_JP, align: 'center', valign: 'middle',
  });

  addFooterNote(slide, '※ システム構成とデータの流れ（開発担当・IT担当向け）');
}

// =================================================
// Slide 8: 段階的導入ロードマップ
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 8);
  addEyebrow(slide, 'SECTION 05 / 導入ロードマップ');
  addTitle(slide, '段階的導入ロードマップ');
  addGradientLine(slide, 2.15);

  const phases = [
    { label: 'Phase 1', period: '1〜3ヶ月', name: 'PoC・最小実装', color: COLORS.lapis, key: 'p1' },
    { label: 'Phase 2', period: '3〜6ヶ月', name: '本番展開', color: COLORS.lapisLight, key: 'p2' },
    { label: 'Phase 3', period: '6〜12ヶ月', name: '拡張・最適化', color: COLORS.sakura, key: 'p3' },
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
      line: { color: p.color, width: 2 },
      rectRadius: 0.15,
    });
    slide.addShape('rect', {
      x, y: colY, w: colW, h: 0.7,
      fill: { color: p.color }, line: { width: 0 },
    });
    slide.addText(p.label, {
      x: x + 0.2, y: colY + 0.05, w: colW - 0.4, h: 0.35,
      fontSize: 14, color: COLORS.white, fontFace: FONT_EN, bold: true, valign: 'top',
    });
    slide.addText(p.period, {
      x: x + 0.2, y: colY + 0.4, w: colW - 0.4, h: 0.3,
      fontSize: 11, color: COLORS.white, fontFace: FONT_JP, valign: 'top',
    });
    slide.addText(p.name, {
      x: x + 0.2, y: colY + 0.85, w: colW - 0.4, h: 0.4,
      fontSize: 16, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'top',
    });
    // 主要施策
    slide.addText(`【主要施策】\n{{paid_roadmap_${p.key}_actions}}`, {
      x: x + 0.2, y: colY + 1.4, w: colW - 0.4, h: 1.4,
      fontSize: 10, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
    // KPI
    slide.addText(`【KPI】\n{{paid_roadmap_${p.key}_kpi}}`, {
      x: x + 0.2, y: colY + 2.85, w: colW - 0.4, h: 1.0,
      fontSize: 10, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'top',
    });
  });

  addFooterNote(slide, '※ 期間・施策は御社状況に応じて調整可能です');
}

// =================================================
// Slide 9: ROI 詳細試算
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 9);
  addEyebrow(slide, 'SECTION 06 / ROI 詳細試算');
  addTitle(slide, '月間効果額の詳細試算');
  addGradientLine(slide, 2.15);

  // 中央: 大数字
  slide.addText('月 ¥{{paid_roi_total_yen}}', {
    x: 0, y: 2.5, w: W, h: 0.9,
    fontSize: 40, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center',
  });

  // 内訳テーブル（最大7項目）
  const tableY = 3.6;
  const tableH = 3.1;
  slide.addShape('roundRect', {
    x: 0.6, y: tableY, w: W - 1.2, h: tableH,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border, width: 1 },
    rectRadius: 0.15,
  });

  // ヘッダ
  const headers = ['No.', '業務領域', '月間時間', '月間効果額', '算式根拠'];
  const colXs = [0.85, 1.4, 6.5, 7.9, 9.5];
  const colWs = [0.4, 5.0, 1.3, 1.5, 3.2];
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: colXs[i], y: tableY + 0.1, w: colWs[i], h: 0.3,
      fontSize: 10, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'middle',
    });
  });

  // 項目行（最大7行）
  const rowY = tableY + 0.45;
  const rowH = 0.32;
  for (let i = 1; i <= 7; i++) {
    const y = rowY + (i - 1) * rowH;
    slide.addText(`{{paid_roi_no_${i}}}`, { x: colXs[0], y, w: colWs[0], h: rowH, fontSize: 10, color: COLORS.lapis, fontFace: FONT_EN, bold: true, valign: 'middle' });
    slide.addText(`{{paid_roi_area_${i}}}`, { x: colXs[1], y, w: colWs[1], h: rowH, fontSize: 10, color: COLORS.text, fontFace: FONT_JP, valign: 'middle' });
    slide.addText(`{{paid_roi_hours_${i}}}`, { x: colXs[2], y, w: colWs[2], h: rowH, fontSize: 10, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'right', valign: 'middle' });
    slide.addText(`{{paid_roi_yen_${i}}}`, { x: colXs[3], y, w: colWs[3], h: rowH, fontSize: 10, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'right', valign: 'middle' });
    slide.addText(`{{paid_roi_basis_${i}}}`, { x: colXs[4], y, w: colWs[4], h: rowH, fontSize: 9, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'middle' });
  }

  addFooterNote(slide, '※ 標準時給1,500円ベース・累計効果は12ヶ月で約 ¥{{paid_roi_total_yen_12mo}}');
}

// =================================================
// Slide 10: コスト試算（フェーズ別）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 10);
  addEyebrow(slide, 'SECTION 07 / コスト試算');
  addTitle(slide, 'コスト試算（フェーズ別）');
  addGradientLine(slide, 2.15);

  // 3列: 初期 / ランニング / スケール時
  const phases = [
    { label: '初期費用', sub: '導入時', key: 'init', color: COLORS.lapis },
    { label: 'ランニング', sub: '月額', key: 'monthly', color: COLORS.lapisLight },
    { label: 'スケール時', sub: '月間1万件処理時', key: 'scale', color: COLORS.sakura },
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
      line: { color: p.color, width: 2 },
      rectRadius: 0.15,
    });
    slide.addShape('rect', {
      x, y: colY, w: colW, h: 0.6,
      fill: { color: p.color }, line: { width: 0 },
    });
    slide.addText(p.label, {
      x: x + 0.2, y: colY + 0.05, w: colW - 0.4, h: 0.3,
      fontSize: 14, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'top',
    });
    slide.addText(p.sub, {
      x: x + 0.2, y: colY + 0.32, w: colW - 0.4, h: 0.25,
      fontSize: 10, color: COLORS.white, fontFace: FONT_JP, valign: 'top',
    });
    // 大金額
    slide.addText(`{{paid_cost_${p.key}_total}}`, {
      x: x + 0.2, y: colY + 0.75, w: colW - 0.4, h: 0.6,
      fontSize: 22, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle',
    });
    // 内訳
    slide.addText(`{{paid_cost_${p.key}_breakdown}}`, {
      x: x + 0.2, y: colY + 1.45, w: colW - 0.4, h: 2.4,
      fontSize: 10, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
  });

  addFooterNote(slide, '※ 具体的サービス名は構成により変動します');
}

// =================================================
// Slide 11: ベンダー/サービスカテゴリ比較
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 11);
  addEyebrow(slide, 'SECTION 08 / カテゴリ比較');
  addTitle(slide, 'ベンダー / サービスカテゴリ比較');
  addGradientLine(slide, 2.15);

  // ヘッダ
  const headers = ['カテゴリ', '選択肢A（軽量）', '選択肢B（中堅）', '選択肢C（最上位）'];
  const colXs = [0.6, 3.8, 7.0, 10.2];
  const colWs = [3.1, 3.1, 3.1, 3.0];

  // ヘッダ行
  slide.addShape('rect', {
    x: 0.6, y: 2.65, w: W - 1.2, h: 0.45,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: colXs[i] + 0.1, y: 2.65, w: colWs[i] - 0.2, h: 0.45,
      fontSize: 11, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle', align: i === 0 ? 'left' : 'center',
    });
  });

  // 5行
  const categories = ['データベース', 'AI推論モデル', '認証・管理', 'インフラ', '開発・運用'];
  const rowY = 3.1;
  const rowH = 0.7;
  categories.forEach((cat, i) => {
    const y = rowY + i * rowH;
    if (i % 2 === 0) {
      slide.addShape('rect', {
        x: 0.6, y, w: W - 1.2, h: rowH,
        fill: { color: COLORS.cardBg }, line: { width: 0 },
      });
    }
    slide.addText(cat, {
      x: colXs[0] + 0.1, y, w: colWs[0] - 0.2, h: rowH,
      fontSize: 11, color: COLORS.text, fontFace: FONT_JP, bold: true, valign: 'middle',
    });
    ['a', 'b', 'c'].forEach((lvl, j) => {
      slide.addText(`{{paid_compare_${i + 1}_${lvl}}}`, {
        x: colXs[j + 1] + 0.1, y, w: colWs[j + 1] - 0.2, h: rowH,
        fontSize: 10, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'middle', align: 'center',
      });
    });
  });

  addFooterNote(slide, '※ サービス名は伏せ、カテゴリと相場感のみ提示');
}

// =================================================
// Slide 12: PoC 計画案
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 12);
  addEyebrow(slide, 'SECTION 09 / PoC計画');
  addTitle(slide, 'PoC（仮説検証）計画案');
  addGradientLine(slide, 2.15);

  // 上部: 5項目グリッド
  const items = [
    { label: '目的', key: 'purpose' },
    { label: '対象業務', key: 'target' },
    { label: '期間', key: 'duration' },
    { label: '成功基準', key: 'success_criteria' },
    { label: '判断ポイント', key: 'decision' },
  ];

  const itemY = 2.65;
  const itemH = 4.05;
  const colW = (W - 1.2 - 0.15 * 4) / 5;

  items.forEach((it, i) => {
    const x = 0.6 + (colW + 0.15) * i;

    slide.addShape('roundRect', {
      x, y: itemY, w: colW, h: itemH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.12,
    });
    slide.addShape('rect', {
      x, y: itemY, w: colW, h: 0.5,
      fill: { color: COLORS.lapis }, line: { width: 0 },
    });
    slide.addText(it.label, {
      x: x + 0.1, y: itemY + 0.05, w: colW - 0.2, h: 0.4,
      fontSize: 12, color: COLORS.white, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle',
    });
    slide.addText(`{{paid_poc_${it.key}}}`, {
      x: x + 0.15, y: itemY + 0.6, w: colW - 0.3, h: itemH - 0.7,
      fontSize: 10, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
  });

  addFooterNote(slide, '※ PoC は通常 4〜8 週間で実施します');
}

// =================================================
// Slide 13: 業種別補助金の該当性チェック
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 13);
  addEyebrow(slide, 'SECTION 10 / 補助金活用');
  addTitle(slide, '業種別補助金の該当性チェック');
  addGradientLine(slide, 2.15);

  // ヘッダ
  const headers = ['補助金名', '公募期間', '上限額', '補助率', '該当性'];
  const colXs = [0.6, 5.0, 7.4, 8.8, 10.4];
  const colWs = [4.3, 2.3, 1.3, 1.5, 2.3];

  slide.addShape('rect', {
    x: 0.6, y: 2.65, w: W - 1.2, h: 0.45,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: colXs[i] + 0.1, y: 2.65, w: colWs[i] - 0.2, h: 0.45,
      fontSize: 11, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
    });
  });

  // 最大4行
  const rowY = 3.1;
  const rowH = 0.6;
  for (let i = 1; i <= 4; i++) {
    const y = rowY + (i - 1) * rowH;
    if (i % 2 === 1) {
      slide.addShape('rect', {
        x: 0.6, y, w: W - 1.2, h: rowH,
        fill: { color: COLORS.cardBg }, line: { width: 0 },
      });
    }
    slide.addText(`{{paid_subsidy_name_${i}}}`, { x: colXs[0] + 0.1, y, w: colWs[0] - 0.2, h: rowH, fontSize: 10, color: COLORS.text, fontFace: FONT_JP, bold: true, valign: 'middle' });
    slide.addText(`{{paid_subsidy_period_${i}}}`, { x: colXs[1] + 0.1, y, w: colWs[1] - 0.2, h: rowH, fontSize: 9, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'middle' });
    slide.addText(`{{paid_subsidy_amount_${i}}}`, { x: colXs[2] + 0.1, y, w: colWs[2] - 0.2, h: rowH, fontSize: 9, color: COLORS.text, fontFace: FONT_JP, valign: 'middle' });
    slide.addText(`{{paid_subsidy_rate_${i}}}`, { x: colXs[3] + 0.1, y, w: colWs[3] - 0.2, h: rowH, fontSize: 9, color: COLORS.text, fontFace: FONT_JP, valign: 'middle' });
    slide.addText(`{{paid_subsidy_fit_${i}}}`, { x: colXs[4] + 0.1, y, w: colWs[4] - 0.2, h: rowH, fontSize: 9, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'middle' });
  }

  // 注記カード
  slide.addShape('roundRect', {
    x: 0.6, y: 5.7, w: W - 1.2, h: 1.0,
    fill: { color: COLORS.sakuraBg },
    line: { color: COLORS.sakura, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(
    '※ 補助金情報は AI による Web 検索（{{paid_subsidy_search_date}} 時点）に基づきます。最新の公募情報は各補助金事務局でご確認ください。\n※ 補助金の申請書作成・申請サポートは Optiens の業務範囲外です。社労士・行政書士へご相談ください。',
    {
      x: 0.8, y: 5.8, w: W - 1.6, h: 0.8,
      fontSize: 10, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'middle',
    }
  );

  addFooterNote(slide, '※ IT導入補助金は対象外（Optiens は IT導入支援事業者未登録のため）');
}

// =================================================
// Slide 14: リスクアセスメント
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 14);
  addEyebrow(slide, 'SECTION 11 / リスクアセスメント');
  addTitle(slide, 'リスクと対策');
  addGradientLine(slide, 2.15);

  // ヘッダ
  const headers = ['リスク', '影響', '発生可能性', '対策'];
  const colXs = [0.6, 4.6, 6.0, 7.5];
  const colWs = [3.9, 1.3, 1.4, 5.2];

  slide.addShape('rect', {
    x: 0.6, y: 2.65, w: W - 1.2, h: 0.45,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: colXs[i] + 0.1, y: 2.65, w: colWs[i] - 0.2, h: 0.45,
      fontSize: 11, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
    });
  });

  // 5項目
  const rowY = 3.1;
  const rowH = 0.7;
  for (let i = 1; i <= 5; i++) {
    const y = rowY + (i - 1) * rowH;
    if (i % 2 === 1) {
      slide.addShape('rect', {
        x: 0.6, y, w: W - 1.2, h: rowH,
        fill: { color: COLORS.cardBg }, line: { width: 0 },
      });
    }
    slide.addText(`{{paid_risk_name_${i}}}`, { x: colXs[0] + 0.1, y, w: colWs[0] - 0.2, h: rowH, fontSize: 11, color: COLORS.text, fontFace: FONT_JP, bold: true, valign: 'middle' });
    slide.addText(`{{paid_risk_impact_${i}}}`, { x: colXs[1] + 0.1, y, w: colWs[1] - 0.2, h: rowH, fontSize: 10, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle' });
    slide.addText(`{{paid_risk_likelihood_${i}}}`, { x: colXs[2] + 0.1, y, w: colWs[2] - 0.2, h: rowH, fontSize: 10, color: COLORS.sakura, fontFace: FONT_JP, bold: true, align: 'center', valign: 'middle' });
    slide.addText(`{{paid_risk_mitigation_${i}}}`, { x: colXs[3] + 0.1, y, w: colWs[3] - 0.2, h: rowH, fontSize: 9, color: COLORS.text, fontFace: FONT_JP, valign: 'middle' });
  }

  addFooterNote(slide, '※ 影響度・発生可能性は 高/中/低 の3段階で評価');
}

// =================================================
// Slide 15: AI事業者ガイドライン整合性
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 15);
  addEyebrow(slide, 'SECTION 12 / コンプライアンス');
  addTitle(slide, 'AI事業者ガイドライン整合性');
  addGradientLine(slide, 2.15);

  // 6項目チェックリスト（2列グリッド）
  const items = [
    { label: '透明性の確保', key: 'transparency' },
    { label: '人間中心の判断', key: 'human_centric' },
    { label: 'プライバシー保護', key: 'privacy' },
    { label: 'セキュリティ確保', key: 'security' },
    { label: '公平性', key: 'fairness' },
    { label: 'アカウンタビリティ', key: 'accountability' },
  ];

  const colW = 6.0;
  const itemH = 1.25;
  const startY = 2.65;

  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.7 + col * (colW + 0.3);
    const y = startY + row * (itemH + 0.15);

    slide.addShape('roundRect', {
      x, y, w: colW, h: itemH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.lapis, width: 1 },
      rectRadius: 0.1,
    });
    // チェックバッジ
    slide.addText('✓', {
      x: x + 0.15, y: y + 0.2, w: 0.6, h: 0.85,
      fontSize: 32, color: COLORS.lapis, fontFace: FONT_EN, bold: true, align: 'center', valign: 'middle',
    });
    slide.addText(it.label, {
      x: x + 0.85, y: y + 0.1, w: colW - 1.0, h: 0.4,
      fontSize: 13, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'middle',
    });
    slide.addText(`{{paid_compliance_${it.key}}}`, {
      x: x + 0.85, y: y + 0.5, w: colW - 1.0, h: 0.7,
      fontSize: 9, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
  });

  addFooterNote(slide, '※ 経産省・総務省「AI事業者ガイドライン」に基づく整合性チェック');
}

// =================================================
// Slide 16: 次のステップ
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 16);
  addEyebrow(slide, 'SECTION 13 / NEXT STEP');
  addTitle(slide, '導入支援への次のステップ');
  addGradientLine(slide, 2.15);

  // ステップ4列
  const steps = [
    { num: '01', label: '60分 MTG', desc: '本レポートをもとに質疑応答・優先度すり合わせ' },
    { num: '02', label: '導入支援契約', desc: '契約締結・体制構築・準備キックオフ' },
    { num: '03', label: 'PoC・最小実装', desc: '1〜2業務に絞り効果検証（4〜8週間）' },
    { num: '04', label: '本番展開', desc: '主要業務へ展開・運用最適化' },
  ];

  const stepW = (W - 1.2 - 0.3 * 3) / 4;
  const stepY = 2.65;
  const stepH = 3.5;

  steps.forEach((s, i) => {
    const x = 0.6 + (stepW + 0.3) * i;

    slide.addShape('roundRect', {
      x, y: stepY, w: stepW, h: stepH,
      fill: { color: COLORS.lapis },
      line: { width: 0 },
      rectRadius: 0.15,
    });
    slide.addText(s.num, {
      x: x + 0.2, y: stepY + 0.3, w: stepW - 0.4, h: 0.7,
      fontSize: 32, color: COLORS.sakuraSoft, fontFace: FONT_EN, bold: true, valign: 'top',
    });
    slide.addText(s.label, {
      x: x + 0.2, y: stepY + 1.2, w: stepW - 0.4, h: 0.5,
      fontSize: 16, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'top',
    });
    slide.addText(s.desc, {
      x: x + 0.2, y: stepY + 1.85, w: stepW - 0.4, h: stepH - 2.05,
      fontSize: 11, color: COLORS.white, fontFace: FONT_JP, valign: 'top',
    });
  });

  // 最下部メッセージ
  slide.addText('まずは 60分 オンラインMTG で詳細をご相談ください', {
    x: 0, y: 6.4, w: W, h: 0.4,
    fontSize: 16, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center',
  });

  addFooterNote(slide, '※ 本費用 ¥5,500 は導入支援契約の初期費用に全額充当');
}

// =================================================
// Slide 17: 裏表紙
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 17);

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
