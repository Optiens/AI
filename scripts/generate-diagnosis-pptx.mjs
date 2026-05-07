/**
 * 無料診断レポート PPTX テンプレ生成
 *
 * 仕様書: executive/ai-consulting/無料診断Slidesテンプレ仕様.md
 * Brand: ディープラピス #1F3A93 + 桜 #E48A95
 *
 * 出力:
 *   tmp/optiens-diagnosis-template-v1.0.pptx
 *
 * 使い方:
 *   node scripts/generate-diagnosis-pptx.mjs
 *
 * その後の流れ:
 *   1. 生成された PPTX を Google Drive にアップロード（自動で Slides に変換）
 *   2. 新しい Slides ファイルの ID を環境変数 GOOGLE_SLIDES_TEMPLATE_ID に設定
 *   3. Service Account にシェア
 */
import pptxgen from 'pptxgenjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TMP_DIR = resolve(ROOT, 'tmp');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

const OUT_PATH = resolve(TMP_DIR, 'optiens-diagnosis-template-v1.0.pptx');
// PPTX埋込み用の軽量ロゴ（480x170 / 18KB）
const LOGO_PATH = resolve(ROOT, 'tmp/optiens-logo-small.png');

// ===== ブランドカラー =====
const COLORS = {
  lapisDark: '152870',     // ラピス濃 / 主要見出し
  lapis: '1F3A93',         // ディープラピス / サブ見出し
  lapisLight: '6B85C9',    // ラピス淡 / グラデ補助
  sakura: 'E48A95',        // 桜 / アクセント
  sakuraSoft: 'FFCED0',    // 桜淡 / 装飾
  text: '0F172A',          // 本文
  textMuted: '475569',     // 本文薄
  caption: '94A3B8',       // キャプション
  cardBg: 'F9FAFB',        // カード背景
  border: 'E5E7EB',        // 罫線
  white: 'FFFFFF',
};

const FONT_JP = 'Noto Sans JP';
const FONT_EN = 'Inter';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';  // 13.333 x 7.5 inches (16:9)
pres.title = 'Optiens 無料AI活用診断レポート テンプレ v1.0';
pres.company = '合同会社Optiens';
pres.subject = 'AI活用診断レポート';
pres.author = 'Optiens';

// SLIDE 寸法
const W = 13.333;
const H = 7.5;

// ===== 共通要素を貼る関数 =====
/**
 * @param {pptxgen.Slide} slide
 * @param {number} pageNum  1始まり
 * @param {number} totalPages
 */
function addCommonElements(slide, pageNum, totalPages) {
  // 左上ロゴ
  slide.addImage({
    path: LOGO_PATH,
    x: 0.4, y: 0.3, w: 1.0, h: 0.35,
  });

  // 右下ページ番号
  slide.addText(
    `${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`,
    {
      x: W - 1.3, y: H - 0.45, w: 1.0, h: 0.25,
      fontSize: 9, color: COLORS.caption, fontFace: FONT_EN,
      align: 'right',
    }
  );

  // 左下フッター
  slide.addText('optiens.com', {
    x: 0.4, y: H - 0.45, w: 2.0, h: 0.25,
    fontSize: 9, color: COLORS.caption, fontFace: FONT_EN,
    italic: true,
  });
}

/** タイトル下のグラデーションライン（ラピス→桜の単色帯で代用） */
function addGradientLine(slide, y) {
  // pptxgenjs の linear gradient は限定的なので、2分割の細帯で表現
  slide.addShape('rect', {
    x: 0.6, y, w: 6.0, h: 0.04,
    fill: { color: COLORS.lapis },
    line: { color: COLORS.lapis, width: 0 },
  });
  slide.addShape('rect', {
    x: 6.6, y, w: 6.0, h: 0.04,
    fill: { color: COLORS.sakura },
    line: { color: COLORS.sakura, width: 0 },
  });
}

/** Eyebrow（小さい英字ラベル） */
function addEyebrow(slide, text, y = 0.95) {
  slide.addText(text, {
    x: 0.6, y, w: 6, h: 0.3,
    fontSize: 11, color: COLORS.lapis, fontFace: FONT_EN,
    bold: true, charSpacing: 8, // letter-spacing 風
  });
}

/** メインタイトル */
function addTitle(slide, text, y = 1.3) {
  slide.addText(text, {
    x: 0.6, y, w: 12, h: 0.8,
    fontSize: 32, color: COLORS.lapisDark, fontFace: FONT_JP,
    bold: true,
  });
}

const TOTAL = 11;

// =================================================
// Slide 1: 表紙
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };

  // 中央ロゴ（大）
  slide.addImage({
    path: LOGO_PATH,
    x: (W - 4) / 2, y: 1.5, w: 4, h: 1.4,
  });

  // タイトル
  slide.addText('AI活用診断 レポート', {
    x: 0, y: 3.3, w: W, h: 0.9,
    fontSize: 40, color: COLORS.lapisDark, fontFace: FONT_JP,
    bold: true, align: 'center',
  });

  // グラデライン
  slide.addShape('rect', {
    x: (W - 6) / 2, y: 4.3, w: 3, h: 0.05,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  slide.addShape('rect', {
    x: W / 2, y: 4.3, w: 3, h: 0.05,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });

  // 顧客名
  slide.addText('{{customer_name}} 様', {
    x: 0, y: 4.8, w: W, h: 0.7,
    fontSize: 28, color: COLORS.text, fontFace: FONT_JP,
    align: 'center',
  });

  // 発行日
  slide.addText('発行日: {{diagnosis_date}}', {
    x: 0, y: 5.7, w: W, h: 0.4,
    fontSize: 16, color: COLORS.textMuted, fontFace: FONT_JP,
    align: 'center',
  });

  // フッター
  slide.addText('合同会社 Optiens', {
    x: 0, y: H - 1.0, w: W, h: 0.3,
    fontSize: 14, color: COLORS.caption, fontFace: FONT_JP,
    align: 'center', bold: true,
  });
  slide.addText('optiens.com', {
    x: 0, y: H - 0.65, w: W, h: 0.3,
    fontSize: 12, color: COLORS.caption, fontFace: FONT_EN,
    align: 'center',
  });
}

// =================================================
// Slide 2: 御社の現状サマリー
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 2, TOTAL);
  addEyebrow(slide, 'SECTION 01 / 御社の現状');
  addTitle(slide, '御社の現状サマリー');
  addGradientLine(slide, 2.15);

  // 本文
  slide.addText('{{current_summary}}', {
    x: 0.6, y: 2.7, w: 12.1, h: 3.5,
    fontSize: 18, color: COLORS.text, fontFace: FONT_JP,
    paraSpaceBefore: 6, paraSpaceAfter: 6,
    valign: 'top',
  });

  // 注記
  slide.addText('※ 本レポートはフォーム入力をもとに、業種・規模に応じた汎用パターンから生成しています', {
    x: 0.6, y: H - 1.0, w: 12.1, h: 0.3,
    fontSize: 10, color: COLORS.caption, fontFace: FONT_JP,
    italic: true,
  });
}

// =================================================
// Slide 3: AI活用が効果的な業務 TOP3
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 3, TOTAL);
  addEyebrow(slide, 'SECTION 02 / AI活用ポイント');
  addTitle(slide, 'AI活用が効果的な業務 TOP3');
  addGradientLine(slide, 2.15);

  // 3カード横並び
  const cardW = 3.9;
  const cardH = 3.6;
  const startX = 0.7;
  const gap = 0.3;
  const cardY = 2.65;

  for (let i = 1; i <= 3; i++) {
    const x = startX + (cardW + gap) * (i - 1);

    // カード本体（薄グレー背景・上部にラピスバンド）
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
      fontSize: 20, color: COLORS.lapis, fontFace: FONT_JP,
      bold: true,
    });

    // 理由
    slide.addText(`{{top3_reason_${i}}}`, {
      x: x + 0.3, y: cardY + 1.8, w: cardW - 0.6, h: 1.2,
      fontSize: 13, color: COLORS.text, fontFace: FONT_JP,
      valign: 'top',
    });

    // 適合タイプ
    slide.addText(`{{top3_type_${i}}}`, {
      x: x + 0.3, y: cardY + cardH - 0.7, w: cardW - 0.6, h: 0.5,
      fontSize: 13, color: COLORS.sakura, fontFace: FONT_JP,
      bold: true,
    });
  }

  // フッター注記
  slide.addText(
    '具体的な自動化提案は 詳細レポート（¥5,500税込） でお届けします',
    {
      x: 0.6, y: H - 1.0, w: 12.1, h: 0.3,
      fontSize: 11, color: COLORS.textMuted, fontFace: FONT_JP,
      italic: true,
    }
  );
}

// =================================================
// Slide 4: 自動化／人間残しの方向性
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 4, TOTAL);
  addEyebrow(slide, 'SECTION 03 / 業務の仕分け');
  addTitle(slide, '自動化と人間残しの方向性');
  addGradientLine(slide, 2.15);

  // 左カラム: AIに任せやすい業務
  slide.addShape('roundRect', {
    x: 0.7, y: 2.65, w: 5.95, h: 3.8,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.lapis, width: 2 },
    rectRadius: 0.15,
  });
  slide.addShape('rect', {
    x: 0.7, y: 2.65, w: 5.95, h: 0.6,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  slide.addText('AIに任せやすい業務', {
    x: 0.9, y: 2.65, w: 5.55, h: 0.6,
    fontSize: 18, color: COLORS.white, fontFace: FONT_JP,
    bold: true, valign: 'middle',
  });
  slide.addText('{{automation_direction}}', {
    x: 0.9, y: 3.45, w: 5.55, h: 2.9,
    fontSize: 14, color: COLORS.text, fontFace: FONT_JP,
    valign: 'top',
  });

  // 右カラム: 人間に残すべき業務
  slide.addShape('roundRect', {
    x: 6.85, y: 2.65, w: 5.95, h: 3.8,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.sakura, width: 2 },
    rectRadius: 0.15,
  });
  slide.addShape('rect', {
    x: 6.85, y: 2.65, w: 5.95, h: 0.6,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });
  slide.addText('人間に残すべき業務', {
    x: 7.05, y: 2.65, w: 5.55, h: 0.6,
    fontSize: 18, color: COLORS.white, fontFace: FONT_JP,
    bold: true, valign: 'middle',
  });
  // 注: 仕様書では同じ {{automation_direction}} に両方が含まれる前提
  slide.addText('（左記参照 / 業種特性に応じた判断軸）', {
    x: 7.05, y: 3.45, w: 5.55, h: 0.5,
    fontSize: 12, color: COLORS.caption, fontFace: FONT_JP,
    italic: true,
  });
  slide.addText('・対人交渉・最終判断', {
    x: 7.05, y: 4.0, w: 5.55, h: 0.4,
    fontSize: 14, color: COLORS.text, fontFace: FONT_JP,
  });
  slide.addText('・関係構築・信頼形成', {
    x: 7.05, y: 4.4, w: 5.55, h: 0.4,
    fontSize: 14, color: COLORS.text, fontFace: FONT_JP,
  });
  slide.addText('・例外対応・想定外への判断', {
    x: 7.05, y: 4.8, w: 5.55, h: 0.4,
    fontSize: 14, color: COLORS.text, fontFace: FONT_JP,
  });
  slide.addText('・倫理・コンプライアンス判断', {
    x: 7.05, y: 5.2, w: 5.55, h: 0.4,
    fontSize: 14, color: COLORS.text, fontFace: FONT_JP,
  });

  slide.addText('※ 個別業務の具体的な仕分け案は詳細レポートで', {
    x: 0.6, y: H - 1.0, w: 12.1, h: 0.3,
    fontSize: 10, color: COLORS.caption, fontFace: FONT_JP,
    italic: true,
  });
}

// =================================================
// Slide 5: チャット型／RAG／エージェントの効きどころ
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 5, TOTAL);
  addEyebrow(slide, 'SECTION 04 / AI種別の方向性');
  addTitle(slide, 'チャット型／RAG／エージェント の効きどころ');
  addGradientLine(slide, 2.15);

  // 3矩形横並び
  const types = [
    { icon: '💬', label: 'チャット型', desc: '対話で完結する問い合わせ・要約' },
    { icon: '🔍', label: 'RAG（社内知識検索）', desc: '社内マニュアル・FAQ参照' },
    { icon: '🤖', label: 'エージェント', desc: '複数ツールを横断した自動化' },
  ];
  const boxW = 3.9;
  const boxH = 2.5;
  const boxY = 2.7;
  const startX = 0.7;
  const gap = 0.3;

  types.forEach((t, i) => {
    const x = startX + (boxW + gap) * i;
    slide.addShape('roundRect', {
      x, y: boxY, w: boxW, h: boxH,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.15,
    });
    slide.addText(t.icon, {
      x, y: boxY + 0.2, w: boxW, h: 0.7,
      fontSize: 32, align: 'center',
    });
    slide.addText(t.label, {
      x: x + 0.2, y: boxY + 1.0, w: boxW - 0.4, h: 0.5,
      fontSize: 16, color: COLORS.lapis, fontFace: FONT_JP,
      bold: true, align: 'center',
    });
    slide.addText(t.desc, {
      x: x + 0.2, y: boxY + 1.5, w: boxW - 0.4, h: 0.9,
      fontSize: 11, color: COLORS.textMuted, fontFace: FONT_JP,
      align: 'center', valign: 'top',
    });
  });

  // 中央下に方向性
  slide.addText('{{ai_type_recommendation}}', {
    x: 0.7, y: 5.5, w: 12, h: 1.0,
    fontSize: 14, color: COLORS.text, fontFace: FONT_JP,
    align: 'center', valign: 'top',
  });

  slide.addText('※ 個別の導入順序や構成案は詳細レポートで', {
    x: 0.6, y: H - 1.0, w: 12.1, h: 0.3,
    fontSize: 10, color: COLORS.caption, fontFace: FONT_JP,
    italic: true,
  });
}

// =================================================
// Slide 6: 仕組みの記述
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 6, TOTAL);
  addEyebrow(slide, 'SECTION 05 / 仕組みの全体像');
  addTitle(slide, '想定される連携サービスと処理の流れ');
  addGradientLine(slide, 2.15);

  // 本文
  slide.addText('{{mechanism_description}}', {
    x: 0.7, y: 2.65, w: 12, h: 4.0,
    fontSize: 15, color: COLORS.text, fontFace: FONT_JP,
    valign: 'top',
  });

  slide.addText('※ 個別のアーキテクチャ図は詳細レポートで', {
    x: 0.6, y: H - 1.0, w: 12.1, h: 0.3,
    fontSize: 10, color: COLORS.caption, fontFace: FONT_JP,
    italic: true,
  });
}

// =================================================
// Slide 7: ROI 試算
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 7, TOTAL);
  addEyebrow(slide, 'SECTION 06 / 想定効果');
  addTitle(slide, '月間効果額の試算');
  addGradientLine(slide, 2.15);

  // 大数字（中央）
  slide.addText('月 ¥{{monthly_value_yen}}', {
    x: 0, y: 2.8, w: W, h: 1.4,
    fontSize: 56, color: COLORS.lapisDark, fontFace: FONT_JP,
    bold: true, align: 'center',
  });

  // 計算式カード
  slide.addShape('roundRect', {
    x: 3.5, y: 4.6, w: 6.3, h: 1.8,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border, width: 1 },
    rectRadius: 0.15,
  });
  slide.addText(
    [
      { text: '月間削減時間: ', options: { color: COLORS.textMuted } },
      { text: '{{monthly_hours_saved}} 時間\n', options: { color: COLORS.text, bold: true } },
      { text: '× 標準時給:    ', options: { color: COLORS.textMuted } },
      { text: '¥1,500\n', options: { color: COLORS.text, bold: true } },
      { text: '─────────────────────\n', options: { color: COLORS.border } },
      { text: '月間効果額:   ', options: { color: COLORS.textMuted } },
      { text: '¥{{monthly_value_yen}}', options: { color: COLORS.lapis, bold: true } },
    ],
    {
      x: 3.7, y: 4.7, w: 5.9, h: 1.6,
      fontSize: 14, fontFace: FONT_EN, valign: 'middle',
    }
  );

  slide.addText('※ 標準時給1,500円ベースの目安です。実際の効果は導入規模により変動します', {
    x: 0.6, y: H - 1.0, w: 12.1, h: 0.3,
    fontSize: 10, color: COLORS.caption, fontFace: FONT_JP,
    italic: true,
  });
}

// =================================================
// Slide 8: コストレンジ
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 8, TOTAL);
  addEyebrow(slide, 'SECTION 07 / 想定コスト');
  addTitle(slide, '導入後の運用コスト目安');
  addGradientLine(slide, 2.15);

  // 中央大表示
  slide.addText('{{cost_range}}', {
    x: 0, y: 3.0, w: W, h: 1.2,
    fontSize: 40, color: COLORS.lapis, fontFace: FONT_JP,
    bold: true, align: 'center',
  });

  // 説明
  slide.addText(
    'AI APIの利用料・連携サービスのサブスク等を含む概算です。\n具体額は構成・規模により変動します。',
    {
      x: 0.6, y: 4.7, w: 12.1, h: 1.0,
      fontSize: 14, color: COLORS.textMuted, fontFace: FONT_JP,
      align: 'center', paraSpaceBefore: 4,
    }
  );

  slide.addText('詳細レポートで個別試算をお届けします', {
    x: 0.6, y: H - 1.0, w: 12.1, h: 0.3,
    fontSize: 11, color: COLORS.lapis, fontFace: FONT_JP,
    align: 'center', italic: true,
  });
}

// =================================================
// Slide 9: 補助金の活用可能性
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 9, TOTAL);
  addEyebrow(slide, 'SECTION 08 / 補助金活用');
  addTitle(slide, '該当しうる補助金（参考）');
  addGradientLine(slide, 2.15);

  // 補助金リスト
  slide.addText('{{subsidies}}', {
    x: 1.0, y: 2.8, w: 11.3, h: 2.5,
    fontSize: 18, color: COLORS.text, fontFace: FONT_JP,
    paraSpaceBefore: 8, paraSpaceAfter: 8,
    valign: 'top',
  });

  // 注記カード（桜薄背景）
  slide.addShape('roundRect', {
    x: 1.0, y: 5.4, w: 11.3, h: 1.2,
    fill: { color: 'FCE4E7' },  // 桜淡
    line: { color: COLORS.sakura, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(
    '※ 補助金の申請書作成・申請サポートは Optiens の業務範囲外です。\n申請は社労士・行政書士・各補助金事務局へご相談ください。',
    {
      x: 1.2, y: 5.5, w: 10.9, h: 1.0,
      fontSize: 12, color: COLORS.textMuted, fontFace: FONT_JP,
      valign: 'middle',
    }
  );
}

// =================================================
// Slide 10: 次のステップ
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 10, TOTAL);
  addEyebrow(slide, 'SECTION 09 / 次のステップ');
  addTitle(slide, 'より詳しいご提案をご希望の場合');
  addGradientLine(slide, 2.15);

  // CTAカード（ラピス背景・白文字）
  slide.addShape('roundRect', {
    x: 1.5, y: 2.8, w: 10.3, h: 4.0,
    fill: { color: COLORS.lapis },
    line: { width: 0 },
    rectRadius: 0.2,
  });

  slide.addText('詳細レポート（¥5,500税込）', {
    x: 1.5, y: 2.95, w: 10.3, h: 0.6,
    fontSize: 24, color: COLORS.white, fontFace: FONT_JP,
    bold: true, align: 'center',
  });

  // 仕切り線（桜）
  slide.addShape('rect', {
    x: 5.5, y: 3.6, w: 2.3, h: 0.04,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });

  // 内容リスト
  const features = [
    '✓ 5〜8ページの詳細レポート',
    '✓ アーキテクチャ図',
    '✓ 具体的な自動化提案 5〜7件',
    '✓ 導入支援の費用見積',
    '✓ 60分オンラインMTG',
    '✓ AI事業者ガイドライン整合性チェック',
  ];
  features.forEach((f, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    slide.addText(f, {
      x: 2.0 + col * 5.0, y: 3.85 + row * 0.4, w: 4.6, h: 0.35,
      fontSize: 14, color: COLORS.white, fontFace: FONT_JP,
    });
  });

  // CTA URL
  slide.addText('お申し込みはこちら → optiens.com/free-diagnosis?paid=1', {
    x: 1.5, y: 6.2, w: 10.3, h: 0.4,
    fontSize: 14, color: COLORS.sakuraSoft, fontFace: FONT_EN,
    align: 'center', bold: true,
  });

  slide.addText('※ 導入支援契約に進まれた場合、本費用は初期費用に全額充当します', {
    x: 0.6, y: H - 1.0, w: 12.1, h: 0.3,
    fontSize: 10, color: COLORS.caption, fontFace: FONT_JP,
    italic: true,
  });
}

// =================================================
// Slide 11: 裏表紙
// =================================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addCommonElements(slide, 11, TOTAL);

  // タイトル
  slide.addText('ご質問・ご相談', {
    x: 0, y: 1.5, w: W, h: 0.8,
    fontSize: 32, color: COLORS.lapisDark, fontFace: FONT_JP,
    bold: true, align: 'center',
  });

  // グラデライン
  slide.addShape('rect', {
    x: (W - 6) / 2, y: 2.5, w: 3, h: 0.05,
    fill: { color: COLORS.lapis }, line: { width: 0 },
  });
  slide.addShape('rect', {
    x: W / 2, y: 2.5, w: 3, h: 0.05,
    fill: { color: COLORS.sakura }, line: { width: 0 },
  });

  // 連絡先
  slide.addText(
    [
      { text: '合同会社 Optiens\n', options: { fontSize: 22, bold: true, color: COLORS.text } },
      { text: '〒407-0301\n', options: { fontSize: 14, color: COLORS.textMuted } },
      { text: '山梨県北杜市高根町清里3545番地2483\n\n', options: { fontSize: 14, color: COLORS.textMuted } },
      { text: 'Web:           ', options: { fontSize: 14, color: COLORS.textMuted } },
      { text: 'https://optiens.com\n', options: { fontSize: 14, color: COLORS.lapis, bold: true } },
      { text: 'お問い合わせ: ', options: { fontSize: 14, color: COLORS.textMuted } },
      { text: 'optiens.com/contact\n', options: { fontSize: 14, color: COLORS.lapis, bold: true } },
      { text: 'Email:           ', options: { fontSize: 14, color: COLORS.textMuted } },
      { text: 'info@optiens.com', options: { fontSize: 14, color: COLORS.lapis, bold: true } },
    ],
    {
      x: 0, y: 3.0, w: W, h: 2.5,
      fontFace: FONT_JP, align: 'center', valign: 'top',
      paraSpaceBefore: 4, paraSpaceAfter: 4,
    }
  );

  // 中央下にロゴ
  slide.addImage({
    path: LOGO_PATH,
    x: (W - 3) / 2, y: 5.8, w: 3, h: 1.05,
  });

  // コピーライト
  slide.addText('© 2026 合同会社 Optiens', {
    x: 0, y: H - 0.45, w: W, h: 0.25,
    fontSize: 9, color: COLORS.caption, fontFace: FONT_EN,
    align: 'center',
  });
}

// =====
await pres.writeFile({ fileName: OUT_PATH });
console.log(`✓ PPTX 生成完了: ${OUT_PATH}`);
console.log(`  スライド数: ${TOTAL}`);
