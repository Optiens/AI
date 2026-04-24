#!/usr/bin/env node
/**
 * AI活用診断レポート — Markdown → PDF 変換スクリプト
 *
 * 使い方:
 *   node scripts/generate-report-pdf.mjs <input.md> [output.pdf]
 *
 * 例:
 *   node scripts/generate-report-pdf.mjs executive/ai-consulting/reports/サンプル_カフェ山の実_20260423.md
 *   → 同じディレクトリに サンプル_カフェ山の実_20260423.pdf を生成
 */

import { mdToPdf } from "md-to-pdf";
import { resolve, dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// 引数
const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/generate-report-pdf.mjs <input.md> [output.pdf]");
  process.exit(1);
}

const resolvedInput = resolve(inputPath);
const outputPath = process.argv[3]
  ? resolve(process.argv[3])
  : join(dirname(resolvedInput), basename(resolvedInput, ".md") + ".pdf");

// CSSテンプレート
const cssPath = join(projectRoot, "executive", "ai-consulting", "pdf-template.css");

console.log(`📄 入力: ${resolvedInput}`);
console.log(`📎 出力: ${outputPath}`);

try {
  const pdf = await mdToPdf(
    { path: resolvedInput },
    {
      stylesheet: [cssPath],
      pdf_options: {
        format: "A4",
        margin: { top: "25mm", right: "20mm", bottom: "30mm", left: "20mm" },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: `
          <div style="width:100%; font-size:8pt; color:#999; padding:0 20mm; display:flex; justify-content:space-between;">
            <span>合同会社Optiens — info@optiens.com</span>
            <span><span class="pageNumber"></span></span>
          </div>
        `,
      },
      launch_options: {
        args: ["--no-sandbox"],
      },
    }
  );

  if (pdf?.content) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(outputPath, pdf.content);
    console.log(`✅ PDF生成完了: ${outputPath}`);
  }
} catch (err) {
  console.error("❌ PDF生成エラー:", err.message);
  process.exit(1);
}
