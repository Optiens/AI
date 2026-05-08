/**
 * 無料診断レポート PPTX テンプレ v2.0（8スライド版・全面刷新）
 *
 * 改修方針（2026-05-08 CEO レビュー反映）:
 * - 11枚 → 8枚に削減（AI種別比較・仕組み・補助金を有償版送り）
 * - 各スライドに「結論+根拠」構造を徹底
 * - AI種別ラベル（チャット型/RAG/エージェント）を非表示化
 * - ROI・コストは項目別分解＋算式根拠
 * - サービス名の出力禁止
 * - 裏表紙に AI 生成注記＋営業メッセージ統合
 *
 * 出力:
 *   tmp/optiens-diagnosis-template-v2.0.pptx
 *
 * 使い方:
 *   node scripts/generate-diagnosis-pptx.mjs
 */
import pptxgen from 'pptxgenjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TMP_DIR = resolve(ROOT, 'tmp');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

const OUT_PATH = resolve(TMP_DIR, 'optiens-diagnosis-template-v2.0.pptx');
const LOGO_PATH = resolve(ROOT, 'tmp/optiens-logo-small.png');

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
};

const FONT_JP = 'Noto Sans JP';
const FONT_EN = 'Inter';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'Optiens 無料AI活用診断レポート テンプレ v2.0';
pres.company = '合同会社Optiens';
pres.subject = 'AI活用診断レポート';
pres.author = 'Optiens';

const W = 13.333;
const H = 7.5;
const TOTAL = 8;

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

// 下部注記: optiens.com / ページ番号と同じ高さ・中央配置
function addFooterNote(slide, text) {
  slide.addText(text, {
    x: 2.5, y: H - 0.45, w: W - 5, h: 0.25,
    fontSize: 9, color: COLORS.caption, fontFace: FONT_JP, italic: true, align: 'center', valign: 'middle',
  });
}

function addGradientLine(slide, y) {
  slide.addShape('rect', { x: 0.6, y, w: 6.0, h: 0.04, fill: { color: COLORS.lapis }, line: { color: COLORS.lapis, width: 0 } });
  slide.addShape('rect', { x: 6.6, y, w: 6.0, h: 0.04, fill: { color: COLORS.sakura }, line: { color: COLORS.sakura, width: 0 } });
}

function addEyebrow(slide, text, y = 0.95) {
  slide.addText(text, { x: 0.6, y, w: 6, h: 0.3, fontSize: 11, color: COLORS.lapis, fontFace: FONT_EN, bold: true, charSpacing: 8 });
}

function addTitle(slide, text, y = 1.3) {
  slide.addText(text, { x: 0.6, y, w: 12, h: 0.8, fontSize: 32, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true });
}

// =================================================
// Slide 1: 表紙
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };

  slide.addImage({ path: LOGO_PATH, x: (W - 4) / 2, y: 1.5, w: 4, h: 1.4 });

  slide.addText('AI活用診断 レポート', {
    x: 0, y: 3.3, w: W, h: 0.9,
    fontSize: 40, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center',
  });

  slide.addShape('rect', { x: (W - 6) / 2, y: 4.3, w: 3, h: 0.05, fill: { color: COLORS.lapis }, line: { width: 0 } });
  slide.addShape('rect', { x: W / 2, y: 4.3, w: 3, h: 0.05, fill: { color: COLORS.sakura }, line: { width: 0 } });

  slide.addText('{{customer_name}} 様', {
    x: 0, y: 4.8, w: W, h: 0.7,
    fontSize: 28, color: COLORS.text, fontFace: FONT_JP, align: 'center',
  });

  slide.addText('発行日: {{diagnosis_date}}', {
    x: 0, y: 5.7, w: W, h: 0.4,
    fontSize: 16, color: COLORS.textMuted, fontFace: FONT_JP, align: 'center',
  });

  slide.addText('合同会社 Optiens', {
    x: 0, y: H - 1.0, w: W, h: 0.3,
    fontSize: 14, color: COLORS.caption, fontFace: FONT_JP, align: 'center', bold: true,
  });
  slide.addText('optiens.com', {
    x: 0, y: H - 0.65, w: W, h: 0.3,
    fontSize: 12, color: COLORS.caption, fontFace: FONT_EN, align: 'center',
  });
}

// =================================================
// Slide 2: 御社の現状サマリー
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 2);
  addEyebrow(slide, 'SECTION 01 / 御社の現状');
  addTitle(slide, '御社の現状サマリー');
  addGradientLine(slide, 2.15);

  slide.addText('{{current_summary}}', {
    x: 0.6, y: 2.7, w: 12.1, h: 4.0,
    fontSize: 17, color: COLORS.text, fontFace: FONT_JP,
    paraSpaceBefore: 6, paraSpaceAfter: 6, valign: 'top',
  });

  addFooterNote(slide, '※ 本レポートはフォーム入力をもとに、業種・規模に応じた汎用パターンから生成しています');
}

// =================================================
// Slide 3: AI活用が効果的な業務 TOP3（AI種別ラベル削除）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 3);
  addEyebrow(slide, 'SECTION 02 / AI活用ポイント');
  addTitle(slide, 'AI活用が効果的な業務 TOP3');
  addGradientLine(slide, 2.15);

  const cardW = 3.9;
  const cardH = 4.0;
  const startX = 0.7;
  const gap = 0.3;
  const cardY = 2.65;

  for (let i = 1; i <= 3; i++) {
    const x = startX + (cardW + gap) * (i - 1);

    slide.addShape('roundRect', {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.15,
    });

    // 番号バッジ
    slide.addShape('roundRect', {
      x: x + 0.3, y: cardY + 0.3, w: 0.7, h: 0.5,
      fill: { color: COLORS.lapis }, line: { width: 0 },
      rectRadius: 0.08,
    });
    slide.addText(`0${i}`, {
      x: x + 0.3, y: cardY + 0.3, w: 0.7, h: 0.5,
      fontSize: 16, color: COLORS.white, fontFace: FONT_EN,
      bold: true, align: 'center', valign: 'middle',
    });

    // 業務領域名
    slide.addText(`{{top3_area_${i}}}`, {
      x: x + 0.3, y: cardY + 1.0, w: cardW - 0.6, h: 0.7,
      fontSize: 18, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
    });

    // 理由（120-180文字想定）
    slide.addText(`{{top3_reason_${i}}}`, {
      x: x + 0.3, y: cardY + 1.8, w: cardW - 0.6, h: 2.0,
      fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
    });
  }

  addFooterNote(slide, '具体的な自動化提案は 詳細レポート（¥5,500税込） でお届けします');
}

// =================================================
// Slide 4: 自動化と人間残しの方向性（左右対称・上部箇条書き＋下部根拠）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 4);
  addEyebrow(slide, 'SECTION 03 / 業務の仕分け');
  addTitle(slide, '自動化と人間残しの方向性');
  addGradientLine(slide, 2.15);

  const colW = 5.95;
  const colH = 4.15;
  const colY = 2.55;
  const leftX = 0.7;
  const rightX = 6.85;
  const headH = 0.5;
  const bulletsH = 1.6;
  const reasonY = colY + headH + bulletsH + 0.1;
  const reasonH = colH - headH - bulletsH - 0.1;

  // 左カラム: AI に任せやすい業務
  slide.addShape('roundRect', {
    x: leftX, y: colY, w: colW, h: colH,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.lapis, width: 2 },
    rectRadius: 0.15,
  });
  slide.addShape('rect', {
    x: leftX, y: colY, w: colW, h: headH,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  slide.addText('AIに任せやすい業務', {
    x: leftX + 0.2, y: colY, w: colW - 0.4, h: headH,
    fontSize: 17, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
  });
  // 上部: 箇条書き（結論）
  slide.addText('{{automation_bullets}}', {
    x: leftX + 0.3, y: colY + headH + 0.1, w: colW - 0.6, h: bulletsH,
    fontSize: 13, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
  });
  // 区切り線
  slide.addShape('line', {
    x: leftX + 0.3, y: colY + headH + bulletsH + 0.05, w: colW - 0.6, h: 0,
    line: { color: COLORS.border, width: 1 },
  });
  // 下部: 根拠
  slide.addText('【なぜAIに任せられるか】', {
    x: leftX + 0.3, y: reasonY, w: colW - 0.6, h: 0.3,
    fontSize: 10, color: COLORS.lapis, fontFace: FONT_JP, bold: true,
  });
  slide.addText('{{automation_reasoning}}', {
    x: leftX + 0.3, y: reasonY + 0.3, w: colW - 0.6, h: reasonH - 0.3,
    fontSize: 11, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'top',
  });

  // 右カラム: 人間に残すべき業務
  slide.addShape('roundRect', {
    x: rightX, y: colY, w: colW, h: colH,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.sakura, width: 2 },
    rectRadius: 0.15,
  });
  slide.addShape('rect', {
    x: rightX, y: colY, w: colW, h: headH,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });
  slide.addText('人間に残すべき業務', {
    x: rightX + 0.2, y: colY, w: colW - 0.4, h: headH,
    fontSize: 17, color: COLORS.white, fontFace: FONT_JP, bold: true, valign: 'middle',
  });
  // 上部: 箇条書き（結論）
  slide.addText('{{human_bullets}}', {
    x: rightX + 0.3, y: colY + headH + 0.1, w: colW - 0.6, h: bulletsH,
    fontSize: 13, color: COLORS.text, fontFace: FONT_JP, valign: 'top',
  });
  // 区切り線
  slide.addShape('line', {
    x: rightX + 0.3, y: colY + headH + bulletsH + 0.05, w: colW - 0.6, h: 0,
    line: { color: COLORS.border, width: 1 },
  });
  // 下部: 根拠
  slide.addText('【なぜ人間に残すべきか】', {
    x: rightX + 0.3, y: reasonY, w: colW - 0.6, h: 0.3,
    fontSize: 10, color: COLORS.sakura, fontFace: FONT_JP, bold: true,
  });
  slide.addText('{{human_reasoning}}', {
    x: rightX + 0.3, y: reasonY + 0.3, w: colW - 0.6, h: reasonH - 0.3,
    fontSize: 11, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'top',
  });

  addFooterNote(slide, '※ 個別業務の具体的な仕分け案は詳細レポートで');
}

// =================================================
// Slide 5: ROI 試算（項目別分解＋算式根拠）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 5);
  addEyebrow(slide, 'SECTION 04 / 想定効果');
  addTitle(slide, '月間効果額の試算');
  addGradientLine(slide, 2.15);

  // 中央: 大数字（合計）
  slide.addText('月 ¥{{monthly_value_yen}}', {
    x: 0, y: 2.55, w: W, h: 1.1,
    fontSize: 48, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center',
  });

  // 内訳テーブル（カード）
  const tableY = 3.85;
  const tableH = 2.85;
  slide.addShape('roundRect', {
    x: 1.0, y: tableY, w: W - 2.0, h: tableH,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border, width: 1 },
    rectRadius: 0.15,
  });

  // ヘッダ
  slide.addText('内訳', {
    x: 1.3, y: tableY + 0.15, w: 3, h: 0.3,
    fontSize: 12, color: COLORS.lapis, fontFace: FONT_JP, bold: true, charSpacing: 4,
  });

  // 各項目: 横3行
  const itemY = tableY + 0.55;
  const itemH = 0.6;
  for (let i = 1; i <= 3; i++) {
    const y = itemY + (i - 1) * itemH;
    slide.addText(`0${i}`, {
      x: 1.3, y, w: 0.5, h: itemH,
      fontSize: 16, color: COLORS.lapis, fontFace: FONT_EN, bold: true, valign: 'middle',
    });
    slide.addText(`{{top3_area_${i}}}`, {
      x: 1.85, y, w: 4.5, h: itemH,
      fontSize: 12, color: COLORS.text, fontFace: FONT_JP, bold: true, valign: 'middle',
    });
    slide.addText(`{{top3_hours_${i}}} 時間/月`, {
      x: 6.4, y, w: 1.6, h: itemH,
      fontSize: 12, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'middle', align: 'right',
    });
    slide.addText(`{{top3_basis_${i}}}`, {
      x: 8.1, y, w: 4.4, h: itemH,
      fontSize: 9, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'middle',
    });
  }

  // 合計行
  const totalY = itemY + 3 * itemH + 0.05;
  slide.addShape('line', {
    x: 1.3, y: totalY - 0.05, w: W - 2.6, h: 0,
    line: { color: COLORS.border, width: 1 },
  });
  slide.addText('合計', {
    x: 1.3, y: totalY, w: 5, h: 0.3,
    fontSize: 12, color: COLORS.text, fontFace: FONT_JP, bold: true, valign: 'middle',
  });
  slide.addText('{{monthly_hours_saved}} 時間/月', {
    x: 6.4, y: totalY, w: 1.6, h: 0.3,
    fontSize: 12, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'right', valign: 'middle',
  });
  slide.addText('× ¥1,500 = ¥{{monthly_value_yen}}', {
    x: 8.1, y: totalY, w: 4.4, h: 0.3,
    fontSize: 11, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, valign: 'middle',
  });

  addFooterNote(slide, '※ 標準時給1,500円ベースの目安です');
}

// =================================================
// Slide 6: コスト試算（項目別分解＋根拠・サービス名禁止）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 6);
  addEyebrow(slide, 'SECTION 05 / 想定コスト');
  addTitle(slide, '導入後の運用コスト目安');
  addGradientLine(slide, 2.15);

  // 中央: 大数字
  slide.addText('月額 {{cost_total_range}}', {
    x: 0, y: 2.55, w: W, h: 1.0,
    fontSize: 36, color: COLORS.lapis, fontFace: FONT_JP, bold: true, align: 'center',
  });

  // 内訳テーブル
  const tableY = 3.8;
  const tableH = 2.9;
  slide.addShape('roundRect', {
    x: 1.0, y: tableY, w: W - 2.0, h: tableH,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border, width: 1 },
    rectRadius: 0.15,
  });
  slide.addText('内訳', {
    x: 1.3, y: tableY + 0.15, w: 3, h: 0.3,
    fontSize: 12, color: COLORS.lapis, fontFace: FONT_JP, bold: true, charSpacing: 4,
  });

  // 5項目分のスロット
  const itemY = tableY + 0.55;
  const itemH = 0.42;
  for (let i = 1; i <= 5; i++) {
    const y = itemY + (i - 1) * itemH;
    slide.addText(`{{cost_category_${i}}}`, {
      x: 1.3, y, w: 4.5, h: itemH,
      fontSize: 12, color: COLORS.text, fontFace: FONT_JP, valign: 'middle',
    });
    slide.addText(`{{cost_amount_${i}}}`, {
      x: 5.8, y, w: 2.0, h: itemH,
      fontSize: 12, color: COLORS.lapis, fontFace: FONT_JP, bold: true, valign: 'middle', align: 'right',
    });
    slide.addText(`{{cost_basis_${i}}}`, {
      x: 7.9, y, w: 4.6, h: itemH,
      fontSize: 9, color: COLORS.textMuted, fontFace: FONT_JP, valign: 'middle',
    });
  }

  addFooterNote(slide, '※ 具体的サービス名は構成により変動します。詳細レポートで個別試算をお届けします');
}

// =================================================
// Slide 7: 次のステップ（字を大きく / 内容拡充 / リンクなし）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 7);
  addEyebrow(slide, 'SECTION 06 / 次のステップ');
  addTitle(slide, 'より詳しいご提案をご希望の場合');
  addGradientLine(slide, 2.15);

  // CTAカード（ラピス背景）
  slide.addShape('roundRect', {
    x: 1.0, y: 2.6, w: W - 2.0, h: 4.1,
    fill: { color: COLORS.lapis },
    line: { width: 0 },
    rectRadius: 0.2,
  });

  // タイトル
  slide.addText('詳細レポート（¥5,500税込）', {
    x: 1.0, y: 2.75, w: W - 2.0, h: 0.7,
    fontSize: 32, color: COLORS.white, fontFace: FONT_JP, bold: true, align: 'center',
  });

  // 仕切り線（桜）
  slide.addShape('rect', {
    x: (W - 2.5) / 2, y: 3.55, w: 2.5, h: 0.04,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });

  // 内容リスト（2列グリッド・大きいフォント）
  const features = [
    '10〜15ページの詳細レポート',
    '具体的な自動化提案 5〜7件',
    'アーキテクチャ図（システム構成）',
    'フロー図（業務手順）',
    '段階的導入ロードマップ',
    'ベンダー/サービスカテゴリ比較',
    'PoC 計画案（仮説検証ステップ）',
    '業種別補助金の該当性チェック',
    '導入支援の費用見積',
    'AI事業者ガイドライン整合性',
    '60分オンラインMTG',
    '質疑・次の判断のすり合わせ',
  ];
  const colItemsCount = 6;
  const startY = 3.85;
  const lineH = 0.42;
  features.forEach((f, i) => {
    const col = i < colItemsCount ? 0 : 1;
    const row = i % colItemsCount;
    slide.addText(`✓  ${f}`, {
      x: 1.5 + col * 5.5, y: startY + row * lineH, w: 5.3, h: lineH,
      fontSize: 16, color: COLORS.white, fontFace: FONT_JP,
    });
  });

  addFooterNote(slide, '※ 導入支援契約に進まれた場合、本費用は初期費用に全額充当します');
}

// =================================================
// Slide 8: 裏表紙（住所削除・AI生成注記・営業メッセージ統合）
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 8);

  slide.addText('ご質問・ご相談', {
    x: 0, y: 1.0, w: W, h: 0.8,
    fontSize: 32, color: COLORS.lapisDark, fontFace: FONT_JP, bold: true, align: 'center',
  });

  // グラデライン
  slide.addShape('rect', { x: (W - 6) / 2, y: 2.0, w: 3, h: 0.05, fill: { color: COLORS.lapis }, line: { width: 0 } });
  slide.addShape('rect', { x: W / 2, y: 2.0, w: 3, h: 0.05, fill: { color: COLORS.sakura }, line: { width: 0 } });

  // 連絡先（住所削除版）
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

  // ブランドコピー（桜薄背景カード）
  slide.addShape('roundRect', {
    x: 2.0, y: 4.1, w: W - 4.0, h: 1.55,
    fill: { color: COLORS.sakuraBg },
    line: { color: COLORS.sakura, width: 1 },
    rectRadius: 0.15,
  });

  slide.addText(
    [
      { text: '本レポートは AI による自動生成です。\n', options: { fontSize: 14, bold: true, color: COLORS.text } },
      { text: '人間が作業する場合は2日、AIなら2分で完結します。\n\n', options: { fontSize: 14, color: COLORS.text } },
      { text: '同じ仕組みを御社に合わせた内容でご提供できますので、お気軽にご相談ください。', options: { fontSize: 13, color: COLORS.textMuted } },
    ],
    {
      x: 2.3, y: 4.25, w: W - 4.6, h: 1.3,
      fontFace: FONT_JP, align: 'center', valign: 'top',
      paraSpaceBefore: 4,
    }
  );

  // ロゴ（中央下）
  slide.addImage({ path: LOGO_PATH, x: (W - 2.5) / 2, y: 6.0, w: 2.5, h: 0.85 });
}

await pres.writeFile({ fileName: OUT_PATH });
console.log(`✓ PPTX v2.0 生成完了: ${OUT_PATH}`);
console.log(`  スライド数: ${TOTAL}（旧11枚 → 8枚）`);
