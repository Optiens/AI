/**
 * 2026-05-06 / 2026-05-07 ブログ記事 24 本のアイキャッチ画像を Imagen 4 Ultra で再生成
 *
 * 対象: 経理・税理士事務所のAI業務自動化（5/6） 〜 「意味の危機」の時代に経営者ができること（5/7）
 * 目的: ブランドカラーが適用されてしまった画像を、中性パレットで作り直す
 *
 * 既存ファイルは _brand.webp としてバックアップ
 *
 * コスト試算: 24 画像 × $0.06 × ¥150 ≒ ¥216
 *
 * 使い方:
 *   node scripts/regenerate-20260506-07-imagen.mjs
 */
import { spawn } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const articles = [
  // ===== 5/6 =====
  {
    slug: '20260506-accounting-tax-ai-automation',
    prompt:
      'Modern editorial illustration of an accountant reviewing receipts and ledger entries on a sleek desk, with abstract data flow visualizations representing AI-assisted bookkeeping in the background. Conveys financial precision and AI-augmented bookkeeping.',
  },
  {
    slug: '20260506-ai-adoption-roadmap-1-3-6-months',
    prompt:
      'Modern editorial illustration of a stepped path or staircase ascending through three milestones (small, medium, large), symbolizing a 1-month / 3-month / 6-month adoption journey. Soft natural lighting, clean composition.',
  },
  {
    slug: '20260506-ai-agent-harness-design-5-patterns',
    prompt:
      'Modern editorial illustration of an abstract control harness or guardrails channeling streams of light and data through defined paths, representing constrained AI agent operation. Conveys structured guidance and safety design.',
  },
  {
    slug: '20260506-ai-agent-vs-chatbot-vs-rag-definition',
    prompt:
      'Modern editorial illustration of three distinct architectural shapes — a simple speech bubble, a layered library shelf, and an interconnected network — placed side by side to symbolize chatbot, RAG, and agent. Clean conceptual composition.',
  },
  {
    slug: '20260506-ai-automation-quote-breakdown',
    prompt:
      'Modern editorial illustration of a layered document breakdown, with stacked translucent panes representing initial fees, running costs, and add-ons. Subtle business invoice aesthetic with clean grid lines.',
  },
  {
    slug: '20260506-ai-automation-under-30k-budget',
    prompt:
      'Modern editorial illustration of a small but well-organized workspace with a single laptop and minimal but effective tools, surrounded by ascending efficiency metrics. Conveys lean small-business setup.',
  },
  {
    slug: '20260506-ai-delegation-risk-and-audit',
    prompt:
      'Modern editorial illustration of a magnifying glass examining a glowing automated workflow, with subtle warning indicators highlighting parts that need human review. Conveys oversight and audit of AI delegation.',
  },
  {
    slug: '20260506-ai-roi-3-indicators',
    prompt:
      'Modern editorial illustration of three rising indicator gauges representing time, cost, and quality metrics, displayed on a clean dashboard interface. Conveys measurable ROI tracking.',
  },
  {
    slug: '20260506-ai-vs-rpa-smb-choice',
    prompt:
      'Modern editorial illustration of two contrasting mechanisms — a precise gear-driven pipeline and an adaptive flowing network — meeting at a junction, symbolizing RPA versus AI for business automation.',
  },
  {
    slug: '20260506-chatgpt-claude-gemini-business-usage',
    prompt:
      'Modern editorial illustration of three abstract geometric forms in distinct neutral palettes, arranged as a comparison triptych representing different AI services for business use. Clean editorial layout.',
  },
  {
    slug: '20260506-clinic-ai-reservation-screening',
    prompt:
      'Modern editorial illustration of a calm clinic reception desk with a tablet showing organized appointment slots, while a treatment room is visible in soft focus behind. Conveys streamlined patient intake.',
  },
  {
    slug: '20260506-construction-industry-ai-5-patterns',
    prompt:
      'Modern editorial illustration of a construction worksite with floating digital overlays of blueprints, schedules, and safety reports. Conveys construction industry meeting digital workflow tools.',
  },
  {
    slug: '20260506-rag-ai-business-manual',
    prompt:
      'Modern editorial illustration of an open book or stack of manuals with glowing data threads extracting and connecting key passages to a query interface. Conveys document knowledge retrieval.',
  },
  {
    slug: '20260506-restaurant-owner-ai-3-tools',
    prompt:
      'Modern editorial illustration of a small cafe or restaurant counter with a smartphone displaying organized reservation, social, and review interfaces. Conveys small-business operator using lightweight digital tools.',
  },
  {
    slug: '20260506-solo-llc-ai-agent-management-optiens',
    prompt:
      'Modern editorial illustration of a single founder at a desk surrounded by abstract holographic team members or assistant personas, suggesting a solo operator augmented by AI agents. Conveys one-person company with AI staff.',
  },
  // ===== 5/7 =====
  {
    slug: '20260507-ai-as-extension-of-left-brain',
    prompt:
      'Modern editorial illustration of an abstract human silhouette with the left hemisphere of the brain extending and connecting to a digital network, while the right hemisphere remains organic. Conveys AI as extension of analytical thinking.',
  },
  {
    slug: '20260507-ai-native-management-three-tier',
    prompt:
      'Modern editorial illustration of three stacked horizontal layers, each with distinct geometric character, connected by clean vertical lines representing executive, orchestrator, and AI tiers. Architectural diagram aesthetic.',
  },
  {
    slug: '20260507-ai-orchestrator-job-role-for-smb',
    prompt:
      'Modern editorial illustration of a conductor figure in front of an orchestra of abstract digital instruments and data flows, symbolizing the AI orchestrator role. Conveys coordination of multiple AI systems.',
  },
  {
    slug: '20260507-alignment-faking-and-harness',
    prompt:
      'Modern editorial illustration of a two-faced abstract entity, one side composed and observed, the other side subtly diverging, with a structured framework attempting to channel its behavior. Conveys deceptive alignment and the need for robust harness design.',
  },
  {
    slug: '20260507-business-visualization-prerequisite-for-ai',
    prompt:
      'Modern editorial illustration of a business process being mapped from a complex tangled flow into a clean structured diagram, with three layered transparent overlays representing process / action / experience. Conveys business visualization as prerequisite.',
  },
  {
    slug: '20260507-five-ai-ceos-2026-january-consensus',
    prompt:
      'Modern editorial illustration of five abstract figures in a meeting circle, each pointing in the same direction, with ascending signal indicators above. Conveys industry leader consensus and shared signals.',
  },
  {
    slug: '20260507-full-automation-limit-and-orchestrator',
    prompt:
      'Modern editorial illustration of an automated assembly line that pauses at a key decision point where a human conductor figure intervenes, before the line resumes. Conveys the limits of full automation and the role of an orchestrator.',
  },
  {
    slug: '20260507-meaning-crisis-management',
    prompt:
      'Modern editorial illustration of a person at a quiet office window, gazing at a horizon where automated workflows operate in the distance, contemplating purpose and meaning. Soft natural light, contemplative mood.',
  },
  {
    slug: '20260507-white-collar-entry-level-disappearing',
    prompt:
      'Modern editorial illustration of an empty entry-level office desk with surrounding senior workstations active, while abstract automated panels handle routine tasks. Conveys structural shift in white-collar entry roles.',
  },
];

function runImagen(prompt, output) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      process.execPath,
      ['scripts/generate-blog-imagen.mjs', prompt, output],
      { cwd: PROJECT_ROOT, stdio: 'inherit', shell: false }
    );
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });
  });
}

let success = 0;
let failed = 0;
const failedSlugs = [];

for (const article of articles) {
  const targetPath = `public/images/blog/${article.slug}.webp`;
  const backupPath = `public/images/blog/${article.slug}_brand.webp`;
  const fullTarget = resolve(PROJECT_ROOT, targetPath);
  const fullBackup = resolve(PROJECT_ROOT, backupPath);

  console.log(`\n=== [${success + failed + 1}/${articles.length}] ${article.slug} ===`);

  if (existsSync(fullTarget) && !existsSync(fullBackup)) {
    copyFileSync(fullTarget, fullBackup);
    console.log(`Backup: ${article.slug}_brand.webp`);
  } else if (existsSync(fullBackup)) {
    console.log(`Backup already exists, skipping backup step`);
  } else {
    console.log(`No existing image (orchestrator orphan), generating fresh`);
  }

  try {
    await runImagen(article.prompt, targetPath);
    success++;
  } catch (err) {
    console.error(`FAILED: ${article.slug} — ${err.message}`);
    failed++;
    failedSlugs.push(article.slug);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Success: ${success}/${articles.length}`);
console.log(`Failed:  ${failed}/${articles.length}`);
if (failedSlugs.length > 0) {
  console.log(`Failed slugs:`);
  failedSlugs.forEach((s) => console.log(`  - ${s}`));
}
