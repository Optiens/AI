import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/pages/ai-examples.astro',
    required: [
      'class="ax-tabs',
      'class="ax-page-intro',
      'class="ax-explorer-grid',
      'class="ax-selector"',
      'class="ax-detail"',
      'class="ax-demo-safety-note',
      'class="ax-implementation-notes',
      'class="ax-basis-note',
      'class="ax-industry-actions',
      'class="ax-adjacent-industries',
      'data-cat="common"',
      'data-cat="industry"',
      'data-cat="role"',
      'data-cat-group="role"',
      'const roleDemos',
      'const nearbyIndustries',
      '外部AI API・第三者送信なし',
      'AI API費用は発生しません',
    ],
    forbidden: [
      {
        label: 'legacy green/red palette',
        pattern: /#2e574c|#5ea89a|#ea4335/i,
      },
      {
        label: 'full replacement demo layout from the 2026-05 regression',
        pattern: /\bdemo-(main|hero|grid|card|policy)\b/,
      },
      {
        label: 'local brand variable override',
        pattern: /--brand\s*:/,
      },
      {
        label: 'inaccurate no-API wording on mixed demo page',
        pattern: /このページ上ではAPI通信・外部送信なし|公開デモはサンプルデータで動作し、このページ上ではAPI通信や外部送信は発生しません/,
      },
    ],
  },
  {
    file: 'src/pages/role-demo/[role].astro',
    required: [
      'class="rd-controls"',
      'id="control-priority"',
      'id="control-approval"',
      'id="control-scope"',
      'このページ上ではAPI通信や外部送信は発生しません',
    ],
    forbidden: [
      {
        label: 'legacy green/red palette',
        pattern: /#2e574c|#5ea89a|#ea4335/i,
      },
      {
        label: 'local brand variable override',
        pattern: /--brand\s*:/,
      },
    ],
  },
];

let hasError = false;

for (const check of checks) {
  const source = readFileSync(check.file, 'utf8');

  for (const required of check.required) {
    if (!source.includes(required)) {
      console.error(`[brand-guard] ${check.file}: missing required layout marker: ${required}`);
      hasError = true;
    }
  }

  const lines = source.split(/\r?\n/);
  for (const forbidden of check.forbidden) {
    const lineIndex = lines.findIndex((line) => forbidden.pattern.test(line));
    if (lineIndex !== -1) {
      console.error(
        `[brand-guard] ${check.file}:${lineIndex + 1}: forbidden ${forbidden.label}: ${lines[lineIndex].trim()}`,
      );
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('[brand-guard] Fix the page before publishing. Use global brand tokens from src/styles/global.css.');
  process.exit(1);
}

console.log('[brand-guard] AI examples brand/layout guard passed.');
