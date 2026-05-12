/**
 * 2026-05-12 / 2026-05-13 ブログ記事のアイキャッチ画像を Imagen 4 Ultra で生成
 * （既存はストック画像の流用なので、バックアップせず上書き）
 *
 * 使い方:
 *   node scripts/regenerate-20260512-13-imagen.mjs
 */
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

const articles = [
  {
    slug: '20260512-vibe-coding-security-utopia-lessons',
    prompt:
      'Modern editorial illustration showing a stylized application interface with a protective shield in the foreground and red warning markers indicating vulnerabilities (an unprotected database, exposed credentials, an open authentication panel). A clear demarcation line separates a "working" prototype side from a "production-ready" hardened side. Clean professional style, no text, no logos, business editorial aesthetic for a Japanese B2B blog about AI-driven development security.',
  },
  {
    slug: '20260513-claude-managed-agent-5-components',
    prompt:
      'Modern editorial illustration of five interconnected structural blocks representing an AI agent operations platform: an Agent block (brain icon), an Environment block (sandboxed container), a Session block (clock and ledger), a Memory block (database), and a Vault block (locked safe storing keys). The blocks are wired together as a managed orchestration layer. Clean professional vector style, no text, no logos, business editorial aesthetic for a Japanese B2B blog about enterprise AI agent deployment.',
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

for (const article of articles) {
  const targetPath = `public/images/blog/${article.slug}.webp`
  console.log(`\n=== ${article.slug} ===`)
  try {
    await runImagen(article.prompt, targetPath)
    success++
  } catch (err) {
    console.error(`FAILED: ${article.slug} — ${err.message}`)
    failed++
  }
}

console.log(`\n=== Summary ===`)
console.log(`Success: ${success}/${articles.length}`)
console.log(`Failed:  ${failed}/${articles.length}`)
