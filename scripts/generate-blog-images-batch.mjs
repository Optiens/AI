/**
 * 既存ブログ記事のアイキャッチ画像を一括生成（gpt-image-2）
 * 各記事のスラッグごとに適切なプロンプトを定義し、画像を生成。
 * 既に画像がある記事はスキップ。
 */
import OpenAI from 'openai';
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+?)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
} catch {}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('OPENAI_API_KEY missing');
  process.exit(1);
}

const STYLE = `
Style: modern editorial business magazine, sophisticated photographic or 3D render quality.
Use a neutral color palette appropriate to the topic — natural lighting, subdued tones,
or topic-relevant colors. DO NOT apply any specific brand color scheme.
No text, no letters, no numbers, no logos, no watermarks.
16:9 horizontal composition, plenty of negative space, cinematic lighting, high quality.
`.trim();

const articles = [
  {
    slug: '20260506-accounting-tax-ai-automation',
    prompt: 'Modern professional accounting office with digital documents flowing between AI agents and human staff, abstract data streams connecting financial reports, calm tax advisory atmosphere',
  },
  {
    slug: '20260506-ai-adoption-roadmap-1-3-6-months',
    prompt: 'A clean abstract roadmap timeline visualized as glowing milestones progressing across a horizontal path, three distinct stage markers representing 1 / 3 / 6 month phases, business strategy concept',
  },
  {
    slug: '20260506-ai-agent-harness-design-5-patterns',
    prompt: 'Abstract concept of safety controls around an AI system: glowing geometric guardrails, harness lines holding a complex AI core in balance, dark technical environment with soft pink highlights',
  },
  {
    slug: '20260506-ai-agent-vs-chatbot-vs-rag-definition',
    prompt: 'Three distinct conceptual zones representing different AI types: a simple chat interface, a document-connected search node, and a complex multi-step autonomous agent network, side by side comparison',
  },
  {
    slug: '20260506-ai-automation-quote-breakdown',
    prompt: 'Professional business invoice with itemized line items glowing softly, financial documents arranged on a desk, modern fintech atmosphere, transparent breakdown concept',
  },
  {
    slug: '20260506-ai-automation-under-30k-budget',
    prompt: 'Small business workspace with a single laptop running AI tools, budget-friendly modern office for solo entrepreneur, warm lighting, accessible technology concept',
  },
  {
    slug: '20260506-ai-delegation-risk-and-audit',
    prompt: 'Audit checklist visualization with magnifying glass over a complex AI system, monitoring dashboards showing risk indicators, balance between trust and oversight',
  },
  {
    slug: '20260506-ai-roi-3-indicators',
    prompt: 'Three glowing performance indicators in a clean dashboard layout: time, cost, quality metrics, abstract data visualization, business analytics concept',
  },
  {
    slug: '20260506-ai-vs-rpa-smb-choice',
    prompt: 'Two distinct paths or technology approaches contrasted side by side: a flexible AI brain on one side and a structured RPA mechanism on the other, decision-making concept',
  },
  {
    slug: '20260506-chatgpt-claude-gemini-business-usage',
    prompt: 'Three distinct stylized AI assistant icons or interfaces side by side, comparison concept for business tools, clean modern design',
  },
  {
    slug: '20260506-clinic-ai-reservation-screening',
    prompt: 'Modern Japanese-style clinic reception desk with subtle digital booking interface, calm healthcare environment, AI-assisted patient intake concept',
  },
  {
    slug: '20260506-construction-industry-ai-5-patterns',
    prompt: 'Construction site with subtle digital overlays showing 5 different process improvements, blueprints and tablets, industrial professionalism',
  },
  {
    slug: '20260506-rag-ai-business-manual',
    prompt: 'Document library being absorbed into a glowing AI knowledge graph, internal company manuals connecting to a central retrieval system, modern enterprise data concept',
  },
  {
    slug: '20260506-restaurant-owner-ai-3-tools',
    prompt: 'Modern small restaurant kitchen and front office with subtle AI-assisted task overlays: SNS posting, reservation, customer messaging icons, warm hospitality atmosphere',
  },
  {
    slug: '20260506-solo-llc-ai-agent-management-optiens',
    prompt: 'A single solo founder at a clean modern home office surrounded by floating AI agent personas representing different business roles, multi-agent management visualization',
  },
  {
    slug: '20260507-ai-as-extension-of-left-brain',
    prompt: 'Conceptual visualization of human brain hemispheres with the left side seamlessly extending into a digital AI network, while the right side glows with creative organic forms, philosophical evolution concept',
  },
  {
    slug: '20260507-business-visualization-prerequisite-for-ai',
    prompt: 'A business workflow being mapped from chaos to clarity: tangled lines on the left transforming into a clean structured flowchart on the right, bird and worm eye perspective concept',
  },
  // 2026-05-08 追加 25本
  {
    slug: '20260508-5days-bootcamp-launch-analysis',
    prompt: 'Abstract conceptual visualization of a multi-day learning program structure, layered timeline with sequential daily highlights ascending in clarity, business analytical perspective on a marketing funnel',
  },
  {
    slug: '20260508-action-level-decomposition',
    prompt: 'Detailed workflow breakdown into granular action steps, magnifying glass examining process details, hierarchical task decomposition concept with layered transparency',
  },
  {
    slug: '20260508-ai-agent-failure-patterns-7',
    prompt: 'Abstract concept of warning signals and checkpoints around AI agents, troubleshooting indicators in a tech environment, cautionary technical scene with seven distinct alert markers',
  },
  {
    slug: '20260508-ai-automated-vs-failed-tasks-optiens',
    prompt: 'Split-screen contrast: successful AI automation flowing smoothly on one side, failed automation hitting obstacles on the other, balanced honest evaluation concept',
  },
  {
    slug: '20260508-ai-info-quality-5-checks',
    prompt: 'Information quality assessment with a filter mechanism separating high-quality insights from noise, critical thinking visualization with five evaluation gates',
  },
  {
    slug: '20260508-ai-native-management-definition',
    prompt: 'Modern executive workspace with AI integrated into core business operations, clean transformation visualization, refined professional atmosphere',
  },
  {
    slug: '20260508-ai-native-management-two-wheels',
    prompt: 'Two interconnected gears representing left-brain efficiency and right-brain creativity working in harmony, balanced symmetric mechanical composition',
  },
  {
    slug: '20260508-alignment-faking-and-harness-design',
    prompt: 'Abstract concept of AI behavior monitoring with transparent guardrails around an AI core, sophisticated technical safety design, conceptual layers of oversight',
  },
  {
    slug: '20260508-claude-code-vs-cursor-vs-copilot',
    prompt: 'Three modern coding tool interfaces compared side by side as abstract glowing developer environments, professional comparison atmosphere',
  },
  {
    slug: '20260508-design-system-driven-ai',
    prompt: 'Brand design system components arranged in a clean grid: color palette swatches, typography samples, button shapes, abstract design rule visualization',
  },
  {
    slug: '20260508-disappearing-vs-resilient-jobs',
    prompt: 'Abstract layered tower with the bottom layer dissolving while upper layers remain solid, hierarchical job structure concept showing erosion from below',
  },
  {
    slug: '20260508-divide-thinking-1oku-breakthrough',
    prompt: 'Mathematical breakdown of a business goal into smaller daily increments, calculator and strategic planning chart blended, mountain peak in distance representing target',
  },
  {
    slug: '20260508-dx-promotion-team-failure-pattern',
    prompt: 'Disconnected boardroom and frontline teams visualization, organizational gap with broken bridge, business transformation challenge atmosphere',
  },
  {
    slug: '20260508-fashion-dx-trap',
    prompt: 'Trendy buzzword bubbles floating above a confused business landscape, contrast between superficial adoption and real transformation, conceptual editorial illustration',
  },
  {
    slug: '20260508-from-ai-model-to-work-os',
    prompt: 'Abstract operating system interface representing integrated work tools, layered software stack with an AI core, modern enterprise workflow infrastructure',
  },
  {
    slug: '20260508-hokuto-yamanashi-ai-support',
    prompt: 'Mountain landscape of rural Japanese countryside blended with subtle digital network elements, regional business support visualization, calm tranquil scene',
  },
  {
    slug: '20260508-ma-fundamentals-smb',
    prompt: 'Two business entities merging through abstract interlocking geometric pieces, professional acquisition consultation atmosphere, formal corporate transaction visualization',
  },
  {
    slug: '20260508-not-100-percent-automation',
    prompt: 'Progress visualization showing optimal automation level around 70 percent, balanced human-AI division concept, clean infographic-style composition',
  },
  {
    slug: '20260508-openai-anthropic-gemini-api',
    prompt: 'Three distinct AI service providers compared as abstract glowing tech nodes, sophisticated technical infrastructure landscape, parallel comparison',
  },
  {
    slug: '20260508-rag-implementation-step-by-step',
    prompt: 'Document database flowing through retrieval pipeline into AI generation, technical RAG architecture visualization with seven stage indicators',
  },
  {
    slug: '20260508-single-vs-multi-tenant',
    prompt: 'Two different building structures contrasted: a shared apartment block versus a private detached house, software tenancy architectural metaphor',
  },
  {
    slug: '20260508-startup-idea-7-checks',
    prompt: 'A lightbulb idea passing through seven evaluation filters, business idea validation funnel, entrepreneurship and decision-making concept',
  },
  {
    slug: '20260508-supabase-vs-firebase-vs-amplify',
    prompt: 'Three cloud database service stacks compared as abstract layered tech platforms, backend infrastructure visualization, technical comparison atmosphere',
  },
  {
    slug: '20260508-three-perspectives-business-decomposition',
    prompt: 'Three perspective icons (bird, insect, and human eye) layered over a business operations map, three layered analytical viewpoint concept',
  },
  {
    slug: '20260508-white-collar-entry-level-strategy',
    prompt: 'Modern office workforce composition with strategic restructuring indicators, business hierarchy adaptation visualization, organizational redesign atmosphere',
  },
];

const client = new OpenAI({ apiKey: API_KEY });
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/images/blog');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

async function generate(article) {
  const outPath = resolve(outDir, `${article.slug}.webp`);
  if (existsSync(outPath)) {
    console.log(`SKIP: ${article.slug}.webp already exists`);
    return { slug: article.slug, status: 'skip' };
  }

  const fullPrompt = `${article.prompt}\n\n${STYLE}`;

  try {
    const response = await client.images.generate({
      model: 'gpt-image-2',
      prompt: fullPrompt,
      size: '1536x1024',
      quality: 'high',
      n: 1,
    });

    const b64 = response.data[0].b64_json;
    const buffer = Buffer.from(b64, 'base64');

    await sharp(buffer).webp({ quality: 85 }).toFile(outPath);
    console.log(`OK: ${article.slug}.webp`);
    return { slug: article.slug, status: 'ok' };
  } catch (err) {
    console.error(`ERROR ${article.slug}: ${err.message}`);
    return { slug: article.slug, status: 'error', error: err.message };
  }
}

console.log(`Generating ${articles.length} images with gpt-image-2...`);

const results = [];
for (const article of articles) {
  const result = await generate(article);
  results.push(result);
  // スリープ（rate limit回避・接続安定化のため長めに）
  await new Promise(r => setTimeout(r, 3000));
}

const ok = results.filter(r => r.status === 'ok').length;
const skip = results.filter(r => r.status === 'skip').length;
const err = results.filter(r => r.status === 'error').length;
console.log(`\nDone: ${ok} generated, ${skip} skipped, ${err} errors`);
if (err > 0) {
  console.log('\nErrors:');
  results.filter(r => r.status === 'error').forEach(r => console.log(`  ${r.slug}: ${r.error}`));
}
