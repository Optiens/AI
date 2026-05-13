/**
 * ブログ用ストック画像 50 枚を Imagen 4 Ultra で一括生成
 *
 * 5 カテゴリ × 各 10 枚 = 50 枚
 * - business-ai: AI 活用・業務効率化（10 枚）
 * - security: セキュリティ・リスク管理（10 枚）
 * - management: 経営判断・中小企業（10 枚）
 * - industry: 業種別（10 枚）
 * - concept: 抽象・コンセプチュアル（10 枚）
 *
 * 出力先: public/images/blog/stock/<slug>.webp
 *
 * 使い方:
 *   node scripts/generate-blog-stock-50.mjs
 */
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const STOCK_DIR = resolve(PROJECT_ROOT, 'public/images/blog/stock')
if (!existsSync(STOCK_DIR)) mkdirSync(STOCK_DIR, { recursive: true })

const BASE_STYLE =
  'Modern editorial illustration, clean vector style, no text, no logos, business editorial aesthetic for a Japanese B2B blog,'

const items = [
  // ===== business-ai (10) =====
  {
    slug: 'business-ai-01-agent-automation',
    prompt:
      'Stylized illustration of an AI agent represented as a friendly digital silhouette orchestrating multiple business workflows on a dashboard, with arrows connecting tasks like email, calendar, and data entry being completed automatically. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-02-data-dashboard',
    prompt:
      'A business analyst examining a clean modern dashboard with charts, KPIs and trend lines glowing softly on a large screen, with AI insight callouts pointing to important data points. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-03-chatbot-customer-support',
    prompt:
      'Conceptual illustration of a customer service workflow where incoming chat messages are intelligently sorted and answered by an AI assistant, while a human operator reviews and approves the responses. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-04-meeting-minutes',
    prompt:
      'A virtual meeting room with floating speech bubbles being captured and transformed into structured meeting notes by an AI assistant, summarizing key decisions and action items. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-05-email-automation',
    prompt:
      'An email inbox being intelligently sorted and triaged by an AI helper, with priority emails highlighted and draft replies appearing automatically for human review. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-06-sns-content',
    prompt:
      'Social media post drafts being generated and scheduled across multiple platforms, with an AI assistant suggesting variations and posting times, on a clean planning calendar interface. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-07-document-creation',
    prompt:
      'A business document being collaboratively drafted by a human and an AI assistant, with sections gradually filling in on a clean digital paper, focusing on the speed and clarity of the workflow. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-08-multilingual',
    prompt:
      'Multiple language speech bubbles flowing through a translation AI hub and emerging as a unified, polished message in another language, conveying real-time multilingual customer communication. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-09-inventory-management',
    prompt:
      'A neat warehouse shelf with items being tracked by an AI system, with restock alerts and order suggestions appearing as digital overlays above the inventory. ' + BASE_STYLE,
  },
  {
    slug: 'business-ai-10-sales-reporting',
    prompt:
      'A monthly sales report being automatically generated from raw transaction data, with the AI highlighting trends, anomalies, and recommended actions in a side panel. ' + BASE_STYLE,
  },

  // ===== security (10) =====
  {
    slug: 'security-01-data-protection',
    prompt:
      'A protective shield surrounding a stylized database tower, with data streams flowing safely inside while red threat arrows bounce off the shield. ' + BASE_STYLE,
  },
  {
    slug: 'security-02-credential-vault',
    prompt:
      'An illustration of a secure vault holding API keys and passwords, with a controlled access channel that lets an AI agent use the credentials without ever seeing them directly. ' + BASE_STYLE,
  },
  {
    slug: 'security-03-incident-response',
    prompt:
      'A security operations dashboard with alerts being investigated and contained, with incident response steps marked as a clear timeline. ' + BASE_STYLE,
  },
  {
    slug: 'security-04-privacy-personal-data',
    prompt:
      'Personal data icons (ID card, address, contact details) surrounded by privacy locks and consent checkmarks, conveying responsible handling of sensitive information. ' + BASE_STYLE,
  },
  {
    slug: 'security-05-authentication-flow',
    prompt:
      'A clean illustration of an authentication flow with a password, email verification, and server-side validation steps shown as a structured pipeline. ' + BASE_STYLE,
  },
  {
    slug: 'security-06-vulnerability-audit',
    prompt:
      'A magnifying glass examining code and configurations on a large screen, with bugs and configuration issues highlighted by orange markers in an audit checklist. ' + BASE_STYLE,
  },
  {
    slug: 'security-07-compliance-checklist',
    prompt:
      'A compliance checklist being verified item-by-item against documents and policies, with green checkmarks appearing along the side. ' + BASE_STYLE,
  },
  {
    slug: 'security-08-phishing-prevention',
    prompt:
      'A suspicious email being intercepted by a filter and quarantined, with a small warning badge, while legitimate emails flow through cleanly to the inbox. ' + BASE_STYLE,
  },
  {
    slug: 'security-09-zero-trust-architecture',
    prompt:
      'A network diagram showing each request being individually verified at multiple checkpoints, with zero implicit trust between services, in a clean isometric style. ' + BASE_STYLE,
  },
  {
    slug: 'security-10-data-backup',
    prompt:
      'Data being safely replicated to multiple secure storage layers, with a restore arrow showing recovery readiness in case of an incident. ' + BASE_STYLE,
  },

  // ===== management (10) =====
  {
    slug: 'management-01-executive-decision',
    prompt:
      'An executive looking at a clear set of options on a screen, weighing tradeoffs with the help of structured AI analysis at the side, conveying calm strategic decision-making. ' + BASE_STYLE,
  },
  {
    slug: 'management-02-roi-analysis',
    prompt:
      'A clean ROI analysis chart with cost on one side, monthly impact on the other, and the break-even point clearly highlighted, conveying business case clarity. ' + BASE_STYLE,
  },
  {
    slug: 'management-03-dx-transformation',
    prompt:
      'Before-and-after illustration of a traditional office workflow gradually being modernized into a digital, AI-supported environment, with smooth transition arrows. ' + BASE_STYLE,
  },
  {
    slug: 'management-04-strategic-planning',
    prompt:
      'A roadmap stretched across multiple quarters with milestones, dependencies, and KPI checkpoints, shown as a clean horizontal timeline. ' + BASE_STYLE,
  },
  {
    slug: 'management-05-subsidy-funding',
    prompt:
      'An application form with green approval stamps and a friendly award icon, representing successful subsidy and grant utilization for small business growth. ' + BASE_STYLE,
  },
  {
    slug: 'management-06-team-collaboration',
    prompt:
      'A small team gathered around a shared digital workspace, each contributing their part, with an AI assistant providing context and reminders. ' + BASE_STYLE,
  },
  {
    slug: 'management-07-kpi-monitoring',
    prompt:
      'A clean dashboard showing four KPI gauges - revenue, customer satisfaction, response time, and team capacity - all updated in real time. ' + BASE_STYLE,
  },
  {
    slug: 'management-08-cost-reduction',
    prompt:
      'A descending cost curve over time juxtaposed with a stable or rising quality curve, demonstrating efficient cost reduction without quality loss. ' + BASE_STYLE,
  },
  {
    slug: 'management-09-business-continuity',
    prompt:
      'A business operations diagram with redundant systems and backup procedures, conveying resilience and continuity planning. ' + BASE_STYLE,
  },
  {
    slug: 'management-10-investor-meeting',
    prompt:
      'A small conference setting where founders present a clean growth chart on a screen to a focused investor audience, conveying a calm and prepared atmosphere. ' + BASE_STYLE,
  },

  // ===== industry (10) =====
  {
    slug: 'industry-01-accommodation-pension',
    prompt:
      'A cozy mountain pension exterior with a tablet on the reception desk showing booking management software, conveying a small hospitality business adopting AI tools. ' + BASE_STYLE,
  },
  {
    slug: 'industry-02-restaurant-cafe',
    prompt:
      'A cozy cafe interior with a tablet at the counter showing a reservation and inventory dashboard, with a smiling barista in the background. ' + BASE_STYLE,
  },
  {
    slug: 'industry-03-bakery',
    prompt:
      'A small bakery counter with fresh bread on display and a tablet showing daily production planning supported by AI predictions, in a warm and inviting setting. ' + BASE_STYLE,
  },
  {
    slug: 'industry-04-winery-brewery',
    prompt:
      'A boutique winery with wooden barrels in the background and a tablet showing batch records and inventory analytics, conveying craft production with digital support. ' + BASE_STYLE,
  },
  {
    slug: 'industry-05-agriculture-farming',
    prompt:
      'A small farm with greenhouses, where a farmer uses a tablet to monitor sensor data and crop schedules, with the natural landscape visible in the background. ' + BASE_STYLE,
  },
  {
    slug: 'industry-06-construction-renovation',
    prompt:
      'A renovation site with blueprints and a tablet showing estimate creation and progress tracking software, with a friendly site manager reviewing the plan. ' + BASE_STYLE,
  },
  {
    slug: 'industry-07-municipality-government',
    prompt:
      'A clean modern government office desk with citizen inquiry tickets being routed by an AI triage system, conveying efficient public service workflows. ' + BASE_STYLE,
  },
  {
    slug: 'industry-08-retail-shop',
    prompt:
      'A small retail shop interior with a friendly shopkeeper at the counter and a tablet showing product analytics and recommendation suggestions. ' + BASE_STYLE,
  },
  {
    slug: 'industry-09-outdoor-tour-guide',
    prompt:
      'An outdoor activity tour guide checking a tablet showing reservation schedules and safety checklists, with a scenic mountain or river background. ' + BASE_STYLE,
  },
  {
    slug: 'industry-10-professional-services',
    prompt:
      'A professional consultation desk with a calm advisor and a client reviewing a digital report together, conveying expertise-driven professional services. ' + BASE_STYLE,
  },

  // ===== concept (10) =====
  {
    slug: 'concept-01-human-ai-collaboration',
    prompt:
      'A human professional and a friendly digital silhouette working side-by-side on a shared task, dividing roles clearly with the human leading judgment and the AI handling repetitive parts. ' + BASE_STYLE,
  },
  {
    slug: 'concept-02-future-progress',
    prompt:
      'A growing plant rooted in data tiles, branching upward into digital interfaces and dashboards, symbolizing organic growth through digital tools. ' + BASE_STYLE,
  },
  {
    slug: 'concept-03-workflow-automation',
    prompt:
      'A series of mechanical-looking task tiles flowing through a smooth pipeline, with each tile transforming as it passes checkpoints, ending at a completed outcome. ' + BASE_STYLE,
  },
  {
    slug: 'concept-04-time-saving',
    prompt:
      'An hourglass with sand flowing in reverse, surrounded by completed task icons rising upward, symbolizing reclaimed time through automation. ' + BASE_STYLE,
  },
  {
    slug: 'concept-05-integration-systems',
    prompt:
      'Multiple distinct apps and services represented as puzzle pieces connecting cleanly through a central hub, conveying seamless integration. ' + BASE_STYLE,
  },
  {
    slug: 'concept-06-knowledge-management',
    prompt:
      'A library of glowing knowledge tiles being indexed and made instantly searchable through a clean retrieval interface. ' + BASE_STYLE,
  },
  {
    slug: 'concept-07-feedback-loop',
    prompt:
      'A circular flow with input, process, output, and review steps repeating in an upward spiral, symbolizing continuous improvement. ' + BASE_STYLE,
  },
  {
    slug: 'concept-08-scaling-up',
    prompt:
      'A small operation pattern duplicating cleanly into a larger network of interconnected nodes, symbolizing scalable AI-assisted operations. ' + BASE_STYLE,
  },
  {
    slug: 'concept-09-trust-transparency',
    prompt:
      'A transparent glass box revealing a clear decision-making process inside, with each step labeled in a clean diagram, conveying explainable AI. ' + BASE_STYLE,
  },
  {
    slug: 'concept-10-balance-optimization',
    prompt:
      'A balance scale weighing efficiency on one side and human judgment on the other, perfectly balanced at the center, conveying optimal business design. ' + BASE_STYLE,
  },
]

function runImagen(prompt, output) {
  return new Promise((res, rej) => {
    const proc = spawn(
      process.execPath,
      ['scripts/generate-blog-imagen.mjs', prompt, output],
      { cwd: PROJECT_ROOT, stdio: 'inherit', shell: false },
    )
    proc.on('close', (code) => {
      if (code === 0) res()
      else rej(new Error(`Exit code ${code}`))
    })
  })
}

let success = 0
let failed = 0
let skipped = 0

console.log(`Generating ${items.length} stock images...`)
console.log(`Output dir: ${STOCK_DIR}`)

for (const [i, item] of items.entries()) {
  const targetPath = `public/images/blog/stock/${item.slug}.webp`
  const absolutePath = resolve(PROJECT_ROOT, targetPath)

  // 既存はスキップ（再実行時の冪等性確保）
  if (existsSync(absolutePath)) {
    console.log(`\n[${i + 1}/${items.length}] SKIP (exists): ${item.slug}`)
    skipped++
    continue
  }

  console.log(`\n[${i + 1}/${items.length}] ${item.slug}`)
  try {
    await runImagen(item.prompt, targetPath)
    success++
  } catch (err) {
    console.error(`FAILED: ${item.slug} — ${err.message}`)
    failed++
  }
}

console.log(`\n=== Summary ===`)
console.log(`Success: ${success}/${items.length}`)
console.log(`Skipped: ${skipped}/${items.length}`)
console.log(`Failed:  ${failed}/${items.length}`)
