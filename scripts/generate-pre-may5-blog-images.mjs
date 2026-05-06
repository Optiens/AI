/**
 * 5月5日以前のブログ記事用画像を一括生成（gpt-image-2、ブランドカラーなし）
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
    slug: '20260424-ai-agent-risks-smb-guide',
    prompt: 'Modern conceptual illustration of AI agent risk assessment for small businesses, security shield protecting a digital workflow, balanced visualization of opportunity and caution',
  },
  {
    slug: '20260424-nationwide-ai-consulting-security-action',
    prompt: 'A modern Japan map silhouette with subtle digital connection lines representing nationwide AI consulting services, security badge motif, professional business atmosphere',
  },
  {
    slug: '20260427-document-editor-demo-launch',
    prompt: 'A document being edited with subtle AI-assisted highlights and suggestions overlay, modern productivity tool concept, clean office desk',
  },
  {
    slug: '20260429-ai-task-decision-framework-smb',
    prompt: 'A decision tree branching into AI-handled tasks and human-handled tasks, business framework visualization, clean diagrammatic style',
  },
  {
    slug: '20260430-cloud-db-ai-agent-for-smb',
    prompt: 'Cloud database with AI agents accessing it, abstract geometric representation of distributed data architecture for small businesses',
  },
  {
    slug: '20260501-ceo-ai-briefing-3-domains',
    prompt: 'A CEO desk in early morning with three holographic information panels showing concise briefing data, executive workspace concept',
  },
  {
    slug: '20260504-ai-suishinho-smb-relation',
    prompt: 'Conceptual visualization of an AI promotion law document interacting with a small business workflow, governmental regulation meeting innovation',
  },
  {
    slug: '20260505-ai-automation-30percent-trap',
    prompt: 'A progress bar stuck at 30 percent with question marks, conceptual illustration of plateaued automation effort, problem-solving business graphic',
  },
  {
    slug: '20260505-ai-guidelines-checklist-smb',
    prompt: 'A clipboard with a clean checklist and AI guidelines documents arranged neatly, professional compliance illustration',
  },
  {
    slug: '20260505-ai-implementation-pitfalls-5',
    prompt: 'Five warning signs or potholes on a road labeled abstractly, business journey concept with caution markers',
  },
  {
    slug: '20260505-ai-training-subsidy-2026',
    prompt: 'A graduation cap meets digital tokens of subsidy support, professional educational financing visualization',
  },
  {
    slug: '20260505-approval-workflow-license-free',
    prompt: 'An approval workflow diagram with green check marks flowing through stages, no traditional license barriers, lightweight modern process design',
  },
  {
    slug: '20260505-chatai-vs-aiagent-housework',
    prompt: 'A split scene comparison: passive chat assistant on one side responding to questions, active autonomous helper on the other side performing household tasks',
  },
  {
    slug: '20260505-free-diagnosis-report-content',
    prompt: 'A detailed diagnostic report document with charts and recommendations, professional consulting deliverable visualization',
  },
  {
    slug: '20260505-hallucination-business-control',
    prompt: 'An AI system with a transparent quality control filter catching errors before they reach output, business reliability concept',
  },
  {
    slug: '20260505-human-vs-ai-3-questions',
    prompt: 'Three thoughtful question marks dividing a workspace into human territory and AI territory, decision-making business illustration',
  },
  {
    slug: '20260505-local-gov-ai-87percent-smb',
    prompt: 'A modern Japanese local government building with subtle digital data overlays, public sector AI adoption concept',
  },
  {
    slug: '20260505-salesforce-ai-agent-3-patterns',
    prompt: 'Three distinct integration patterns visualized as connected geometric structures, enterprise CRM AI agent architecture concept',
  },
  {
    slug: '20260505-self-use-self-improve-crm',
    prompt: 'A self-improvement loop visualization with internal CRM continuously refined by usage, organizational learning concept',
  },
  {
    slug: '20260505-small-team-ai-agent-division',
    prompt: 'A small team workspace with multiple AI agent personas distributed across roles, collaborative human-AI organization concept',
  },
];

const client = new OpenAI({ apiKey: API_KEY });
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/images/blog');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

console.log(`Generating ${articles.length} images...`);
const results = [];
for (const a of articles) {
  const outPath = resolve(outDir, `${a.slug}.webp`);
  if (existsSync(outPath)) {
    console.log(`SKIP: ${a.slug}`);
    continue;
  }
  try {
    const response = await client.images.generate({
      model: 'gpt-image-2',
      prompt: `${a.prompt}\n\n${STYLE}`,
      size: '1536x1024',
      quality: 'high',
      n: 1,
    });
    const buffer = Buffer.from(response.data[0].b64_json, 'base64');
    await sharp(buffer).webp({ quality: 85 }).toFile(outPath);
    console.log(`OK: ${a.slug}`);
    results.push({ slug: a.slug, ok: true });
  } catch (err) {
    console.error(`ERROR ${a.slug}: ${err.message}`);
    results.push({ slug: a.slug, ok: false, err: err.message });
  }
  await new Promise(r => setTimeout(r, 500));
}

const ok = results.filter(r => r.ok).length;
const errors = results.filter(r => !r.ok);
console.log(`\nDone: ${ok} generated, ${errors.length} errors`);
errors.forEach(e => console.log(`  ${e.slug}: ${e.err}`));
