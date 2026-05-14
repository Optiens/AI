import fs from 'node:fs';
import path from 'node:path';
import { JWT, OAuth2Client } from 'google-auth-library';

const TITLE = 'Optiens 無料AI活用診断レポート テンプレ v1.0';
const SCALE = 4 / 3;
const WIDTH = 960;
const HEIGHT = 540;
const FONT_JP = 'Noto Sans JP';
const FONT_EN = 'Inter';
const SERVICE_ACCOUNT_EMAIL = 'optiens-slides-automation@optiens-slides-automation.iam.gserviceaccount.com';
const OWNER_EMAIL = 'takahashi.daichi@optiens.com';

const COLORS = {
  white: '#FFFFFF',
  lapisDark: '#152870',
  lapis: '#1F3A93',
  lapisLight: '#6B85C9',
  sakura: '#E48A95',
  sakuraSoft: '#FFCED0',
  text: '#0F172A',
  heading: '#1A1A2E',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  muted: '#64748B',
};

const cli = parseArgs(process.argv.slice(2));
const env = {
  ...loadEnv(path.resolve('.env')),
  ...loadEnv(path.resolve('.env.local')),
  ...process.env,
};

if (cli.help) {
  printHelp();
  process.exit(0);
}

const requests = buildDeckRequests();

if (cli.dryRun || cli.check) {
  console.log(JSON.stringify({
    title: TITLE,
    slideCount: 11,
    requestCount: requests.length,
    shareEmails: getShareEmails(env, 'dry-run'),
  }, null, 2));
  process.exit(0);
}

const { auth, mode, serviceAccountEmail } = await createAuth(env);

const existingPresentationId = cli.presentationId || env.GOOGLE_SLIDES_TEMPLATE_ID;
if (existingPresentationId && !cli.forceCreate) {
  const result = await patchExistingTemplate(auth, existingPresentationId);
  console.log([
    'Existing Google Slides template checked.',
    `Title: ${result.title}`,
    `Template ID: ${existingPresentationId}`,
    `URL: https://docs.google.com/presentation/d/${existingPresentationId}/edit`,
    `Slide count: ${result.slideCount}`,
    `Added placeholders: ${result.addedPlaceholders.length ? result.addedPlaceholders.join(', ') : '(none)'}`,
    `Missing placeholders: ${result.missingPlaceholders.length ? result.missingPlaceholders.join(', ') : '(none)'}`,
  ].join('\n'));
  process.exit(result.missingPlaceholders.length ? 1 : 0);
}

const presentation = await googleJson(auth, 'https://slides.googleapis.com/v1/presentations', {
  method: 'POST',
  body: { title: TITLE },
});

if (!presentation.presentationId) {
  throw new Error(`Slides API did not return a presentationId: ${JSON.stringify(presentation)}`);
}

await googleJson(
  auth,
  `https://slides.googleapis.com/v1/presentations/${presentation.presentationId}:batchUpdate`,
  {
    method: 'POST',
    body: { requests },
  },
);

const shareEmails = getShareEmails(env, mode, serviceAccountEmail);
for (const email of shareEmails) {
  await googleJson(
    auth,
    `https://www.googleapis.com/drive/v3/files/${presentation.presentationId}/permissions?sendNotificationEmail=false`,
    {
      method: 'POST',
      body: {
        type: 'user',
        role: 'writer',
        emailAddress: email,
      },
    },
  );
}

console.log([
  'Google Slides template created.',
  `Title: ${TITLE}`,
  `Template ID: ${presentation.presentationId}`,
  `URL: https://docs.google.com/presentation/d/${presentation.presentationId}/edit`,
  `Auth mode: ${mode}`,
  `Shared with: ${shareEmails.length ? shareEmails.join(', ') : '(none)'}`,
].join('\n'));

function buildDeckRequests() {
  const requests = [
    {
      createSlide: {
        objectId: 'slide_01',
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    },
  ];

  for (let i = 2; i <= 11; i += 1) {
    requests.push({
      createSlide: {
        objectId: slideId(i),
        insertionIndex: i - 1,
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    });
  }

  slide1(requests);
  slide2(requests);
  slide3(requests);
  slide4(requests);
  slide5(requests);
  slide6(requests);
  slide7(requests);
  slide8(requests);
  slide9(requests);
  slide10(requests);
  slide11(requests);

  return requests;
}

function slide1(requests) {
  const s = slideId(1);
  background(requests, s);
  logo(requests, s, 48, 35, 24, true);
  text(requests, s, 'cover_title', 'AI活用診断 レポート', 64, 102, 520, 56, {
    size: 34,
    bold: true,
    color: COLORS.lapisDark,
  });
  gradientLine(requests, s, 66, 168, 180, 3);
  text(requests, s, 'cover_customer', '{{customer_name}} 様', 64, 205, 520, 36, {
    size: 22,
    bold: true,
    color: COLORS.text,
  });
  text(requests, s, 'cover_date', '発行日: {{diagnosis_date}}', 64, 254, 300, 24, {
    size: 14,
    color: COLORS.muted,
  });
  text(requests, s, 'cover_company', '合同会社 Optiens', 64, 313, 260, 22, {
    size: 13,
    color: COLORS.text,
    bold: true,
  });
  text(requests, s, 'cover_url', 'optiens.com', 64, 337, 180, 18, {
    size: 11,
    color: COLORS.muted,
    font: FONT_EN,
  });
  shape(requests, s, 'cover_accent_circle', 'ELLIPSE', 540, 68, 106, 106, {
    fill: '#F9E9EC',
    outline: '#F9E9EC',
  });
  shape(requests, s, 'cover_accent_dot', 'ELLIPSE', 583, 111, 20, 20, {
    fill: COLORS.sakura,
    outline: COLORS.sakura,
  });
}

function slide2(requests) {
  const s = slideId(2);
  baseSlide(requests, s, 2);
  eyebrow(requests, s, 'Section 01 / 御社の現状');
  title(requests, s, '御社の現状サマリー');
  card(requests, s, 'summary_card', 58, 124, 604, 152);
  text(requests, s, 'summary_text', '{{current_summary}}', 83, 151, 554, 94, {
    size: 22,
    color: COLORS.text,
    bold: true,
    valign: 'MIDDLE',
  });
  text(requests, s, 'summary_note', '※ 本レポートはフォーム入力をもとに、業種・規模に応じた汎用パターンから生成しています', 67, 300, 590, 28, {
    size: 11,
    color: COLORS.muted,
  });
}

function slide3(requests) {
  const s = slideId(3);
  baseSlide(requests, s, 3);
  title(requests, s, 'AI活用が効果的な業務 TOP3');
  const cards = [
    [48, '{{top3_area_1}}', '{{top3_reason_1}}', '{{top3_type_1}}'],
    [260, '{{top3_area_2}}', '{{top3_reason_2}}', '{{top3_type_2}}'],
    [472, '{{top3_area_3}}', '{{top3_reason_3}}', '{{top3_type_3}}'],
  ];
  cards.forEach(([x, area, reason, typeValue], index) => {
    const n = index + 1;
    card(requests, s, `top3_card_${n}`, x, 127, 190, 158);
    pill(requests, s, `top3_badge_${n}`, `0${n}`, x + 18, 145, 42, 24, COLORS.lapis, COLORS.white);
    text(requests, s, `top3_area_${n}`, area, x + 18, 182, 154, 34, {
      size: 17,
      bold: true,
      color: COLORS.text,
    });
    text(requests, s, `top3_reason_${n}`, reason, x + 18, 222, 154, 36, {
      size: 11,
      color: COLORS.muted,
    });
    pill(requests, s, `top3_type_${n}`, typeValue, x + 18, 263, 88, 20, COLORS.sakuraSoft, COLORS.lapisDark);
  });
  text(requests, s, 'top3_footer_note', '具体的な自動化提案は 詳細レポート（¥5,500税込） でお届けします', 58, 314, 570, 24, {
    size: 11,
    color: COLORS.muted,
  });
}

function slide4(requests) {
  const s = slideId(4);
  baseSlide(requests, s, 4);
  title(requests, s, '自動化／人間残しの方向性');
  card(requests, s, 'automation_left', 48, 125, 292, 152, { outline: COLORS.lapis });
  card(requests, s, 'automation_right', 380, 125, 292, 152, { outline: COLORS.sakura });
  text(requests, s, 'automation_left_title', 'AIに任せやすい業務', 70, 147, 245, 24, {
    size: 17,
    bold: true,
    color: COLORS.lapis,
  });
  text(requests, s, 'automation_left_body', '定型化しやすい入力、確認、集計、通知など', 70, 190, 235, 48, {
    size: 13,
    color: COLORS.text,
  });
  text(requests, s, 'automation_right_title', '人間に残すべき業務', 402, 147, 245, 24, {
    size: 17,
    bold: true,
    color: COLORS.sakura,
  });
  text(requests, s, 'automation_right_body', '判断、交渉、創造、顧客との信頼形成など', 402, 190, 235, 48, {
    size: 13,
    color: COLORS.text,
  });
  text(requests, s, 'automation_direction', '{{automation_direction}}', 62, 301, 596, 38, {
    size: 13,
    color: COLORS.muted,
  });
}

function slide5(requests) {
  const s = slideId(5);
  baseSlide(requests, s, 5);
  title(requests, s, 'チャット型／RAG／エージェントの効きどころ');
  const items = [
    ['chat', 'チャット型', '相談・文案作成', 48, COLORS.lapis],
    ['rag', 'RAG', '社内情報検索', 260, COLORS.lapisLight],
    ['agent', 'エージェント', '複数業務の連携', 472, COLORS.sakura],
  ];
  items.forEach(([key, label, desc, x, color]) => {
    card(requests, s, `ai_type_${key}`, x, 126, 190, 126);
    text(requests, s, `ai_type_${key}_title`, label, x + 18, 146, 148, 24, {
      size: 18,
      bold: true,
      color,
    });
    text(requests, s, `ai_type_${key}_desc`, desc, x + 18, 180, 148, 24, {
      size: 12,
      color: COLORS.muted,
    });
    bar(requests, s, `ai_type_${key}_bar`, x + 18, 220, 132, color);
  });
  card(requests, s, 'ai_type_recommendation_card', 58, 282, 604, 54, { fill: '#FBFCFF' });
  text(requests, s, 'ai_type_recommendation', '{{ai_type_recommendation}}', 76, 299, 566, 24, {
    size: 13,
    color: COLORS.text,
  });
}

function slide6(requests) {
  const s = slideId(6);
  baseSlide(requests, s, 6);
  title(requests, s, '仕組みの記述');
  card(requests, s, 'mechanism_card', 56, 124, 608, 148);
  text(requests, s, 'mechanism_description', '{{mechanism_description}}', 80, 146, 560, 102, {
    size: 15,
    color: COLORS.text,
  });
  text(requests, s, 'mechanism_services_label', '連携サービス例', 60, 296, 120, 18, {
    size: 11,
    bold: true,
    color: COLORS.lapis,
  });
  ['LINE公式', '会計', 'カレンダー', 'ナレッジ'].forEach((label, index) => {
    pill(requests, s, `mechanism_chip_${index + 1}`, label, 170 + index * 102, 292, 86, 23, '#EEF2FF', COLORS.lapisDark);
  });
  text(requests, s, 'mechanism_note', '※ 個別のアーキテクチャ図は詳細レポートで', 60, 331, 360, 18, {
    size: 10,
    color: COLORS.muted,
  });
}

function slide7(requests) {
  const s = slideId(7);
  baseSlide(requests, s, 7);
  title(requests, s, 'ROI 試算');
  text(requests, s, 'roi_value', '月 {{monthly_value_yen}} 円', 72, 132, 420, 62, {
    size: 42,
    bold: true,
    color: COLORS.lapisDark,
    font: FONT_EN,
  });
  gradientLine(requests, s, 76, 202, 210, 3);
  card(requests, s, 'roi_formula_card', 76, 230, 420, 88);
  text(requests, s, 'roi_formula', '月間削減時間: {{monthly_hours_saved}} 時間\n× 標準時給: ¥1,500\n= 月間効果額: {{monthly_value_yen}} 円', 96, 247, 380, 52, {
    size: 14,
    color: COLORS.text,
  });
  shape(requests, s, 'roi_side_shape', 'ELLIPSE', 545, 150, 82, 82, {
    fill: '#F9E9EC',
    outline: '#F9E9EC',
  });
  text(requests, s, 'roi_note', '※ 標準時給1,500円ベースの目安です', 76, 334, 330, 18, {
    size: 10,
    color: COLORS.muted,
  });
}

function slide8(requests) {
  const s = slideId(8);
  baseSlide(requests, s, 8);
  title(requests, s, 'コストレンジ');
  card(requests, s, 'cost_card', 74, 138, 572, 120, { fill: '#FBFCFF' });
  text(requests, s, 'cost_range', '{{cost_range}}', 104, 173, 512, 42, {
    size: 30,
    bold: true,
    color: COLORS.lapisDark,
  });
  text(requests, s, 'cost_note', '具体額は構成・規模により変動します。詳細レポートで個別試算をお届けします', 91, 295, 540, 34, {
    size: 12,
    color: COLORS.muted,
  });
}

function slide9(requests) {
  const s = slideId(9);
  baseSlide(requests, s, 9);
  title(requests, s, '補助金の活用可能性');
  card(requests, s, 'subsidies_card', 76, 132, 568, 124);
  text(requests, s, 'subsidies', '{{subsidies}}', 104, 159, 510, 64, {
    size: 20,
    bold: true,
    color: COLORS.text,
  });
  text(requests, s, 'subsidies_note_1', '※ 補助金の申請書作成・申請サポートは Optiens の業務範囲外です', 80, 291, 560, 20, {
    size: 11,
    color: COLORS.muted,
  });
  text(requests, s, 'subsidies_note_2', '※ デジタル化補助金は除外しています', 80, 318, 360, 18, {
    size: 10,
    color: COLORS.muted,
  });
}

function slide10(requests) {
  const s = slideId(10);
  baseSlide(requests, s, 10);
  title(requests, s, '次のステップ');
  card(requests, s, 'next_card', 76, 120, 568, 186, { fill: '#FBFCFF' });
  text(requests, s, 'next_heading', '詳細レポート（¥5,500税込）', 104, 146, 400, 28, {
    size: 22,
    bold: true,
    color: COLORS.lapisDark,
  });
  text(requests, s, 'next_items', '✓ アーキテクチャ図\n✓ 具体的な自動化提案 5〜7件\n✓ 導入支援の費用見積\n✓ 60分オンラインMTG', 108, 188, 360, 84, {
    size: 15,
    color: COLORS.text,
  });
  pill(requests, s, 'next_cta', 'お申し込みはこちら', 458, 181, 142, 30, COLORS.lapis, COLORS.white);
  text(requests, s, 'next_url', 'optiens.com/free-diagnosis?paid=1', 420, 225, 205, 32, {
    size: 11,
    color: COLORS.lapisDark,
    font: FONT_EN,
  });
}

function slide11(requests) {
  const s = slideId(11);
  background(requests, s);
  logo(requests, s, 56, 45, 28, true);
  text(requests, s, 'back_title', 'ご質問・ご相談', 64, 108, 420, 44, {
    size: 32,
    bold: true,
    color: COLORS.lapisDark,
  });
  gradientLine(requests, s, 66, 164, 150, 3);
  text(requests, s, 'back_contact', '合同会社 Optiens\n〒407-0301\n山梨県北杜市高根町清里3545-2483\n\nWeb: https://optiens.com\nお問い合わせ: optiens.com/contact', 66, 203, 430, 132, {
    size: 15,
    color: COLORS.text,
  });
  shape(requests, s, 'back_symbol_outer', 'ELLIPSE', 545, 196, 90, 90, {
    fill: COLORS.white,
    outline: COLORS.lapis,
    outlineWeight: 4,
  });
  shape(requests, s, 'back_symbol_dot', 'ELLIPSE', 583, 234, 14, 14, {
    fill: COLORS.sakura,
    outline: COLORS.sakura,
  });
}

function baseSlide(requests, slide, pageNumber) {
  background(requests, slide);
  logo(requests, slide, 34, 25, 18, true);
  footer(requests, slide, pageNumber);
}

function background(requests, slide) {
  shape(requests, slide, `${slide}_bg`, 'RECTANGLE', 0, 0, WIDTH, HEIGHT, {
    fill: COLORS.white,
    outline: COLORS.white,
  });
}

function title(requests, slide, value) {
  text(requests, slide, `${slide}_title`, value, 48, 72, 590, 38, {
    size: 28,
    bold: true,
    color: COLORS.heading,
  });
  gradientLine(requests, slide, 50, 114, 170, 2);
}

function eyebrow(requests, slide, value) {
  text(requests, slide, `${slide}_eyebrow`, value, 50, 52, 360, 18, {
    size: 10,
    bold: true,
    color: COLORS.sakura,
    font: FONT_EN,
  });
}

function footer(requests, slide, pageNumber) {
  text(requests, slide, `${slide}_footer_url`, 'optiens.com | 合同会社Optiens', 34, 374, 240, 16, {
    size: 9,
    color: COLORS.muted,
    font: FONT_EN,
  });
  text(requests, slide, `${slide}_page`, `${String(pageNumber).padStart(2, '0')} / 11`, 635, 374, 58, 16, {
    size: 9,
    color: COLORS.muted,
    font: FONT_EN,
    align: 'END',
  });
}

function logo(requests, slide, x, y, size, withWordmark = false) {
  shape(requests, slide, `${slide}_logo_outer_${Math.round(x)}_${Math.round(y)}`, 'ELLIPSE', x, y, size, size, {
    fill: COLORS.white,
    outline: COLORS.lapis,
    outlineWeight: Math.max(1.5, size / 8),
  });
  shape(requests, slide, `${slide}_logo_dot_${Math.round(x)}_${Math.round(y)}`, 'ELLIPSE', x + size * 0.43, y + size * 0.43, size * 0.16, size * 0.16, {
    fill: COLORS.sakura,
    outline: COLORS.sakura,
  });
  if (withWordmark) {
    text(requests, slide, `${slide}_logo_word_${Math.round(x)}_${Math.round(y)}`, 'Optiens', x + size + 8, y + size * 0.06, 120, size * 0.9, {
      size: Math.max(11, size * 0.48),
      bold: true,
      color: COLORS.lapisDark,
      font: FONT_EN,
    });
  }
}

function gradientLine(requests, slide, x, y, width, height) {
  const segment = width / 3;
  shape(requests, slide, `${slide}_grad_a_${Math.round(x)}_${Math.round(y)}`, 'RECTANGLE', x, y, segment, height, {
    fill: COLORS.lapis,
    outline: COLORS.lapis,
  });
  shape(requests, slide, `${slide}_grad_b_${Math.round(x)}_${Math.round(y)}`, 'RECTANGLE', x + segment, y, segment, height, {
    fill: COLORS.lapisLight,
    outline: COLORS.lapisLight,
  });
  shape(requests, slide, `${slide}_grad_c_${Math.round(x)}_${Math.round(y)}`, 'RECTANGLE', x + segment * 2, y, segment, height, {
    fill: COLORS.sakura,
    outline: COLORS.sakura,
  });
}

function card(requests, slide, id, x, y, width, height, options = {}) {
  shape(requests, slide, id, 'ROUND_RECTANGLE', x, y, width, height, {
    fill: options.fill ?? COLORS.surface,
    outline: options.outline ?? COLORS.border,
    outlineWeight: options.outlineWeight ?? 1,
  });
}

function pill(requests, slide, id, value, x, y, width, height, fill, color) {
  shape(requests, slide, `${id}_shape`, 'ROUND_RECTANGLE', x, y, width, height, {
    fill,
    outline: fill,
  });
  text(requests, slide, `${id}_text`, value, x, y + 2, width, height - 2, {
    size: 10,
    bold: true,
    color,
    align: 'CENTER',
    valign: 'MIDDLE',
    font: FONT_EN,
  });
}

function bar(requests, slide, id, x, y, width, fill) {
  shape(requests, slide, `${id}_bg`, 'RECTANGLE', x, y, width, 8, {
    fill: '#E5E7EB',
    outline: '#E5E7EB',
  });
  shape(requests, slide, `${id}_fill`, 'RECTANGLE', x, y, width * 0.72, 8, {
    fill,
    outline: fill,
  });
  text(requests, slide, `${id}_label`, '適合度', x, y - 18, 70, 14, {
    size: 9,
    color: COLORS.muted,
  });
}

function shape(requests, slide, id, shapeType, x, y, width, height, options = {}) {
  requests.push({
    createShape: {
      objectId: id,
      shapeType,
      elementProperties: {
        pageObjectId: slide,
        size: {
          width: pt(width * SCALE),
          height: pt(height * SCALE),
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: x * SCALE,
          translateY: y * SCALE,
          unit: 'PT',
        },
      },
    },
  });

  const shapeProperties = {};
  if (options.fill) {
    shapeProperties.shapeBackgroundFill = {
      solidFill: { color: rgb(options.fill) },
    };
  }
  if (options.outline) {
    shapeProperties.outline = {
      outlineFill: { solidFill: { color: rgb(options.outline) } },
      weight: pt((options.outlineWeight ?? 1) * SCALE),
    };
  }

  if (Object.keys(shapeProperties).length > 0) {
    requests.push({
      updateShapeProperties: {
        objectId: id,
        shapeProperties,
        fields: 'shapeBackgroundFill.solidFill.color,outline.outlineFill.solidFill.color,outline.weight',
      },
    });
  }
}

function text(requests, slide, id, value, x, y, width, height, options = {}) {
  shape(requests, slide, id, 'TEXT_BOX', x, y, width, height, {
    fill: options.fill,
    outline: options.outline,
  });
  requests.push({
    insertText: {
      objectId: id,
      insertionIndex: 0,
      text: value,
    },
  });
  requests.push({
    updateTextStyle: {
      objectId: id,
      textRange: { type: 'ALL' },
      style: {
        fontFamily: options.font ?? FONT_JP,
        fontSize: pt((options.size ?? 14) * SCALE),
        foregroundColor: { opaqueColor: rgb(options.color ?? COLORS.text) },
        bold: Boolean(options.bold),
      },
      fields: 'fontFamily,fontSize,foregroundColor,bold',
    },
  });
  if (options.align) {
    requests.push({
      updateParagraphStyle: {
        objectId: id,
        textRange: { type: 'ALL' },
        style: { alignment: options.align },
        fields: 'alignment',
      },
    });
  }
  if (options.valign) {
    requests.push({
      updateShapeProperties: {
        objectId: id,
        shapeProperties: {
          contentAlignment: options.valign,
        },
        fields: 'contentAlignment',
      },
    });
  }
}

function pt(magnitude) {
  return { magnitude, unit: 'PT' };
}

function rgb(hex) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized.slice(0, 6), 16);
  return {
    rgbColor: {
      red: ((value >> 16) & 255) / 255,
      green: ((value >> 8) & 255) / 255,
      blue: (value & 255) / 255,
    },
  };
}

function slideId(number) {
  return `slide_${String(number).padStart(2, '0')}`;
}

async function patchExistingTemplate(auth, presentationId) {
  let title = TITLE;
  try {
    await googleJson(auth, `https://www.googleapis.com/drive/v3/files/${presentationId}?supportsAllDrives=true`, {
      method: 'PATCH',
      body: { name: TITLE },
    });
  } catch (error) {
    title = `${TITLE} (Drive metadata rename skipped: ${error.message.split('\n')[0]})`;
  }

  const deck = await googleJson(
    auth,
    `https://slides.googleapis.com/v1/presentations/${presentationId}`,
  );
  const textContent = collectDeckText(deck);
  const existingPlaceholders = findPlaceholders(textContent);
  const expectedPlaceholders = [
    'customer_name',
    'diagnosis_date',
    'current_summary',
    'top3_area_1',
    'top3_area_2',
    'top3_area_3',
    'top3_reason_1',
    'top3_reason_2',
    'top3_reason_3',
    'top3_type_1',
    'top3_type_2',
    'top3_type_3',
    'automation_direction',
    'ai_type_recommendation',
    'mechanism_description',
    'monthly_hours_saved',
    'monthly_value_yen',
    'cost_range',
    'subsidies',
  ];

  const addedPlaceholders = [];
  const patchRequests = [
    {
      replaceAllText: {
        containsText: { text: '✓ 5〜8ページの詳細レポート', matchCase: true },
        replaceText: '✓ 15〜20枚の詳細レポート',
      },
    },
    {
      replaceAllText: {
        containsText: { text: '✓ 5～8ページの詳細レポート', matchCase: true },
        replaceText: '✓ 15〜20枚の詳細レポート',
      },
    },
  ];

  const missingTop3Types = ['top3_type_1', 'top3_type_2', 'top3_type_3']
    .filter((placeholder) => !existingPlaceholders.includes(placeholder));
  if (missingTop3Types.length > 0 && deck.slides?.[2]?.objectId) {
    const slide = deck.slides[2].objectId;
    const stamp = Date.now().toString(36);
    const xs = [54, 280.8, 507.6];
    missingTop3Types.forEach((placeholder, index) => {
      pill(
        patchRequests,
        slide,
        `patch_${placeholder}_${stamp}`,
        `{{${placeholder}}}`,
        xs[index],
        280,
        90,
        18,
        COLORS.sakuraSoft,
        COLORS.lapisDark,
      );
      addedPlaceholders.push(placeholder);
    });
  }

  if (patchRequests.length > 0) {
    await googleJson(
      auth,
      `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
      {
        method: 'POST',
        body: { requests: patchRequests },
      },
    );
  }

  const updatedDeck = await googleJson(
    auth,
    `https://slides.googleapis.com/v1/presentations/${presentationId}`,
  );
  const updatedPlaceholders = findPlaceholders(collectDeckText(updatedDeck));
  return {
    title,
    slideCount: updatedDeck.slides?.length ?? 0,
    addedPlaceholders,
    missingPlaceholders: expectedPlaceholders.filter((placeholder) => !updatedPlaceholders.includes(placeholder)),
  };
}

function collectDeckText(deck) {
  return (deck.slides ?? [])
    .flatMap((slide) => slide.pageElements ?? [])
    .flatMap((element) => collectElementText(element))
    .join('\n');
}

function collectElementText(element) {
  const values = [];
  if (element.shape?.text?.textElements) {
    values.push(element.shape.text.textElements.map((item) => item.textRun?.content ?? '').join(''));
  }
  if (element.table?.tableRows) {
    for (const row of element.table.tableRows) {
      for (const cell of row.tableCells ?? []) {
        values.push(...(cell.text?.textElements ?? []).map((item) => item.textRun?.content ?? ''));
      }
    }
  }
  if (element.group?.children) {
    for (const child of element.group.children) values.push(...collectElementText(child));
  }
  return values;
}

function findPlaceholders(textContent) {
  return [...new Set([...textContent.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((match) => match[1]))];
}

async function createAuth(values) {
  const scopes = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive',
  ];
  const keyFile = cli.keyFile || values.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || values.GOOGLE_APPLICATION_CREDENTIALS;
  const keyJson = values.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (keyFile || keyJson || (values.GOOGLE_SERVICE_ACCOUNT_EMAIL && values.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)) {
    const credentials = keyFile
      ? JSON.parse(fs.readFileSync(path.resolve(keyFile), 'utf8'))
      : keyJson
        ? JSON.parse(keyJson)
        : {
            client_email: values.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: values.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
            project_id: values.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
          };
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes,
    });
    await auth.authorize();
    return {
      auth,
      mode: 'service-account',
      serviceAccountEmail: credentials.client_email,
    };
  }

  if (
    values.GOOGLE_SLIDES_USE_OAUTH_REFRESH_TOKEN === 'true'
    && values.GOOGLE_CLIENT_ID
    && values.GOOGLE_CLIENT_SECRET
    && values.GOOGLE_REFRESH_TOKEN
  ) {
    const auth = new OAuth2Client(values.GOOGLE_CLIENT_ID, values.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: values.GOOGLE_REFRESH_TOKEN });
    return {
      auth,
      mode: 'oauth-refresh-token',
      serviceAccountEmail: values.GOOGLE_SERVICE_ACCOUNT_EMAIL || SERVICE_ACCOUNT_EMAIL,
    };
  }

  throw new Error([
    'Google auth is not configured.',
    'Set GOOGLE_SERVICE_ACCOUNT_KEY_FILE, GOOGLE_SERVICE_ACCOUNT_JSON,',
    'or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.',
    'The existing GOOGLE_REFRESH_TOKEN is ignored unless GOOGLE_SLIDES_USE_OAUTH_REFRESH_TOKEN=true,',
    'because this repository also uses a Google Tasks-only token.',
  ].join(' '));
}

async function googleJson(auth, url, options = {}) {
  const accessToken = await getAccessToken(auth);
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const textBody = await response.text();
  const parsed = textBody ? JSON.parse(textBody) : {};
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${url} failed: ${response.status} ${response.statusText}\n${JSON.stringify(parsed, null, 2)}`);
  }
  return parsed;
}

async function getAccessToken(auth) {
  const token = await auth.getAccessToken();
  if (typeof token === 'string') return token;
  if (token?.token) return token.token;
  throw new Error(`Could not obtain Google access token: ${JSON.stringify(token)}`);
}

function getShareEmails(values, mode, serviceAccountEmail = SERVICE_ACCOUNT_EMAIL) {
  if (cli.shareEmail) return [cli.shareEmail];
  if (values.GOOGLE_SLIDES_TEMPLATE_SHARE_EMAILS) {
    return values.GOOGLE_SLIDES_TEMPLATE_SHARE_EMAILS
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (mode === 'oauth-refresh-token') return [values.GOOGLE_SERVICE_ACCOUNT_EMAIL || serviceAccountEmail];
  return [OWNER_EMAIL];
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--check') parsed.check = true;
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else if (arg === '--force-create') parsed.forceCreate = true;
    else if (arg === '--key-file') {
      parsed.keyFile = args[i + 1];
      i += 1;
    } else if (arg === '--presentation-id') {
      parsed.presentationId = args[i + 1];
      i += 1;
    } else if (arg === '--share-email') {
      parsed.shareEmail = args[i + 1];
      i += 1;
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`
Create the Optiens free AI diagnosis Google Slides template.

Usage:
  npm run create:slides-template
  npm run create:slides-template:check
  npm run create:slides-template -- --key-file ./optiens-slides-automation.json
  node scripts/create-free-diagnosis-slides-template.mjs --presentation-id <Slides ID>
  node scripts/create-free-diagnosis-slides-template.mjs --dry-run
  node scripts/create-free-diagnosis-slides-template.mjs --force-create

Auth:
  Preferred:
    GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./optiens-slides-automation.json
  or:
    GOOGLE_SERVICE_ACCOUNT_EMAIL=...
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="<service-account-private-key-with-escaped-newlines>"

Sharing:
  When GOOGLE_SLIDES_TEMPLATE_ID is set, the script checks and patches that existing template.
  This is the recommended service-account path because service accounts have 0 Drive storage quota.
  Service-account mode shares the template with ${OWNER_EMAIL}.
  OAuth mode shares the template with ${SERVICE_ACCOUNT_EMAIL}.
  Override with --share-email or GOOGLE_SLIDES_TEMPLATE_SHARE_EMAILS.
`.trim());
}
