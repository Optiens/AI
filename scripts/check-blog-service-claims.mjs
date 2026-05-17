import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

const root = process.cwd();
const blogDir = resolve(root, 'src/content/blog');

const args = new Set(process.argv.slice(2));
const jsonOutput = args.has('--json');
const failOnWarn = args.has('--fail-on-warn');

const files = readdirSync(blogDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => join(blogDir, file))
  .filter((file) => statSync(file).isFile());

const freeTerms = [
  /AI\s*活用診断\s*簡易版/,
  /無料\s*AI\s*活用診断/,
  /無料AI活用診断/,
  /AI\s*活用診断（無料）/,
  /AI活用診断（無料）/,
  /無料診断/,
  /無料AI診断/,
  /無料レポート/,
  /無料診断レポート/,
];

const paidTerms = [
  /詳細版AI\s*活用診断/,
  /詳細版\s*AI\s*活用診断/,
  /詳細レポート/,
  /有料レポート/,
  /有償詳細レポート/,
  /有償の詳細レポート/,
];

const globalRules = [
  {
    id: 'global-free-meeting',
    severity: 'error',
    pattern: /無料\s*(MTG|ミーティング|面談|コンサル)/,
    message: '無料版にMTG・面談・無料コンサルが含まれるように読めます。',
  },
  {
    id: 'global-free-consultation-wording',
    severity: 'warn',
    pattern: /無料\s*相談/,
    message: '無料相談は人による相談に読めるため、AI活用診断簡易版など範囲が明確な表現を推奨します。',
  },
  {
    id: 'global-paid-meeting-included',
    severity: 'error',
    pattern: /(詳細レポート|詳細版AI\s*活用診断|詳細版)[^。\n]{0,80}(MTG|ミーティング|面談|ヒアリング)[^。\n]{0,40}(含|付き|込み|実施|行)/,
    message: '詳細版AI活用診断にMTG・面談が含まれるように読めます。',
  },
  {
    id: 'global-pdf-delivery',
    severity: 'warn',
    pattern: /(PDF\s*納品|PDF\s*レポート|PDFでお渡し|PDFとして整形|PDF\/Excel\/Word.*添付対応|PDF.*直接添付)/,
    message: '診断レポートの標準納品・現行フォーム仕様とズレる可能性があります。',
  },
  {
    id: 'global-digital-subsidy',
    severity: 'error',
    pattern: /デジタル化補助金/,
    message: 'デジタル化補助金はAI活用診断レポートに記載しない方針です。',
  },
];

const scopedRules = [
  {
    id: 'free-overpromise-security-dev',
    scope: freeTerms,
    terms: /(設計レビュー|テスト実施|修正提案|脆弱性診断|修正実装|実装伴走|セットアップ伴走|テストゲート通過|一気通貫|ハーネス設計案|構成案|アーキテクチャ図|導入支援見積|見積もり項目の妥当性チェック)/,
    severity: 'error',
    message: '無料のAI活用診断で、実作業・詳細設計・個別診断まで約束しているように読めます。',
  },
  {
    id: 'free-overpromise-human-process',
    scope: freeTerms,
    terms: /(ヒアリング|聞き取り|一緒に整理|ご提案|サポートします|業務全体を見渡|優先順位をつけ|現状評価|次の一手|すべてについて)/,
    severity: 'warn',
    message: '無料版の範囲を、フォーム入力ベースの簡易レポート以上に見せている可能性があります。',
  },
  {
    id: 'paid-execution-included',
    scope: paidTerms,
    terms: /(脆弱性診断|テスト実施|修正実装|実装伴走|セットアップ伴走|構築します|納品します|導入します|実装します|一気通貫|テストゲート通過)/,
    severity: 'error',
    message: '詳細版AI活用診断に、実作業・脆弱性診断・修正実装が含まれるように読めます。',
  },
  {
    id: 'paid-meeting-included',
    scope: paidTerms,
    terms: /(MTG|ミーティング|面談|ヒアリング)/,
    severity: 'error',
    message: '詳細版AI活用診断にMTG・面談・ヒアリングが含まれるように読めます。',
  },
];

function splitParagraphs(text) {
  const lines = text.split(/\r?\n/);
  const paragraphs = [];
  let buffer = [];
  let startLine = 1;

  const flush = (endLine) => {
    if (!buffer.length) return;
    const text = buffer.join('\n').trim();
    if (text) paragraphs.push({ text, startLine, endLine });
    buffer = [];
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (line.trim() === '') {
      flush(lineNumber - 1);
      startLine = lineNumber + 1;
      return;
    }
    if (!buffer.length) startLine = lineNumber;
    buffer.push(line);
  });
  flush(lines.length);
  return paragraphs;
}

function hasAny(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

function matchPositions(patterns, text) {
  const positions = [];
  for (const pattern of patterns) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const globalPattern = new RegExp(pattern.source, flags);
    for (const match of text.matchAll(globalPattern)) {
      positions.push({ index: match.index ?? 0, text: match[0] });
    }
  }
  return positions.sort((a, b) => a.index - b.index);
}

function findScopedMatch(rule, paragraphText) {
  const scopePositions = matchPositions(rule.scope, paragraphText);
  if (!scopePositions.length) return null;

  const termPattern = new RegExp(rule.terms.source, rule.terms.flags.includes('g') ? rule.terms.flags : `${rule.terms.flags}g`);
  const termMatches = [...paragraphText.matchAll(termPattern)];
  if (!termMatches.length) return null;

  const paidPositions = matchPositions(paidTerms, paragraphText);

  for (const scope of scopePositions) {
    for (const term of termMatches) {
      const termIndex = term.index ?? 0;
      const distance = Math.abs(termIndex - scope.index);
      if (distance > 180) continue;

      if (rule.id === 'paid-meeting-included' && /^MTGなし/.test(paragraphText.slice(termIndex))) {
        continue;
      }

      if (rule.id.startsWith('free-')) {
        const scopeBeforeTerm = scope.index <= termIndex;
        const paidBetween = paidPositions.some((paid) => paid.index > scope.index && paid.index < termIndex);
        if (scopeBeforeTerm && paidBetween) continue;
      }

      if (rule.id.startsWith('paid-')) {
        if (termIndex < scope.index) continue;
      }

      return term[0];
    }
  }

  return null;
}

function findLine(text, excerpt) {
  const lines = text.split(/\r?\n/);
  const normalized = excerpt.replace(/\s+/g, ' ').trim().slice(0, 24);
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].replace(/\s+/g, ' ').includes(normalized)) {
      return i + 1;
    }
  }
  return 1;
}

const findings = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = file.replace(`${root}\\`, '').replaceAll('\\', '/');

  for (const rule of globalRules) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    const line = findLine(text, match[0]);
    findings.push({
      file: rel,
      line,
      severity: rule.severity,
      rule: rule.id,
      message: rule.message,
      excerpt: match[0].replace(/\s+/g, ' ').trim(),
    });
  }

  for (const paragraph of splitParagraphs(text)) {
    for (const rule of scopedRules) {
      if (!hasAny(rule.scope, paragraph.text)) continue;
      const match = findScopedMatch(rule, paragraph.text);
      if (!match) continue;
      findings.push({
        file: rel,
        line: paragraph.startLine,
        severity: rule.severity,
        rule: rule.id,
        message: rule.message,
        excerpt: paragraph.text.replace(/\s+/g, ' ').trim().slice(0, 220),
      });
    }
  }
}

const summary = {
  filesChecked: files.length,
  findings: findings.length,
  errors: findings.filter((finding) => finding.severity === 'error').length,
  warnings: findings.filter((finding) => finding.severity === 'warn').length,
};

if (jsonOutput) {
  console.log(JSON.stringify({ summary, findings }, null, 2));
} else {
  console.log(`Checked ${summary.filesChecked} blog files.`);
  console.log(`Findings: ${summary.findings} (${summary.errors} errors, ${summary.warnings} warnings)`);
  for (const finding of findings) {
    console.log(`\n[${finding.severity.toUpperCase()}] ${finding.file}:${finding.line}`);
    console.log(`  rule: ${finding.rule}`);
    console.log(`  ${finding.message}`);
    console.log(`  excerpt: ${finding.excerpt}`);
  }
}

if (summary.errors > 0 || (failOnWarn && summary.warnings > 0)) {
  process.exitCode = 1;
}
