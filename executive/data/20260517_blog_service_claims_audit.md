# ブログサービス範囲表現チェック記録（2026-05-17）

## 対象

- 対象ディレクトリ: `src/content/blog/`
- 対象記事数: 147 本
- 実行コマンド: `npm run check:blog-service-claims`
- 正本: `AGENTS.md`、`executive/ai-consulting/blog-service-claim-rules.md`

## 判定

- 修正後公開可
- 最終結果: 0 errors / 0 warnings

## 確認したルール

| 区分 | 判定基準 |
|---|---|
| AI活用診断簡易版 | 無料、フォーム入力ベース、Google Slides簡易レポート、MTGなし |
| 詳細版AI活用診断 | ¥5,500税込、MTGなし、導入可否・優先順位・構成案・費用前提を整理 |
| スポット相談 | 人による相談・要件整理・小規模作業・AI診断官レビュー |
| 導入支援 | 実装、API連携、初期動作確認、運用マニュアル等は個別見積 |

## 走査結果

| 時点 | 対象記事数 | Error | Warning | 対応 |
|---|---:|---:|---:|---|
| 初回走査 | 147 | 19 | 35 | サービス範囲を超えるCTA・相談表現を修正 |
| 修正後走査 | 147 | 0 | 0 | 公開前ゲート通過 |

## 主な修正方針

- 「無料AI活用診断」で設計レビュー、テスト実施、修正提案、実装伴走、セットアップ伴走を約束しない。
- 「詳細レポート」「詳細版AI活用診断」に脆弱性診断、修正実装、MTG、ヒアリングが含まれるように書かない。
- 「無料相談」「無料コンサル」は、人による相談に読めるため、AI活用診断簡易版など範囲が明確な表現へ変更する。
- 実装・検査・環境反映・個別相談は、導入支援またはスポット相談として個別見積に分離する。

## 変更した主なファイル

- `AGENTS.md`
- `.agents/skills/process-transcript/SKILL.md`
- `.agents/skills/write-blog-article/SKILL.md`
- `executive/ai-consulting/blog-service-claim-rules.md`
- `scripts/check-blog-service-claims.mjs`
- `package.json`
- `src/content/blog/20260424-nationwide-ai-consulting-security-action.md`
- `src/content/blog/20260505-free-diagnosis-report-content.md`
- `src/content/blog/20260505-self-use-self-improve-crm.md`
- `src/content/blog/20260506-ai-agent-harness-design-5-patterns.md`
- `src/content/blog/20260506-ai-agent-vs-chatbot-vs-rag-definition.md`
- `src/content/blog/20260506-ai-automation-under-30k-budget.md`
- `src/content/blog/20260506-ai-roi-3-indicators.md`
- `src/content/blog/20260506-clinic-ai-reservation-screening.md`
- `src/content/blog/20260506-solo-llc-ai-agent-management-optiens.md`
- `src/content/blog/20260507-alignment-faking-and-harness.md`
- `src/content/blog/20260507-five-ai-ceos-2026-january-consensus.md`
- `src/content/blog/20260507-meaning-crisis-management.md`
- `src/content/blog/20260508-action-level-decomposition.md`
- `src/content/blog/20260508-ai-agent-failure-patterns-7.md`
- `src/content/blog/20260508-ai-complacency-not-overconfidence.md`
- `src/content/blog/20260508-ai-native-management-two-wheels.md`
- `src/content/blog/20260508-alignment-faking-and-harness-design.md`
- `src/content/blog/20260508-claude-code-vs-cursor-vs-copilot.md`
- `src/content/blog/20260508-disappearing-vs-resilient-jobs.md`
- `src/content/blog/20260508-divide-thinking-1oku-breakthrough.md`
- `src/content/blog/20260508-fashion-dx-trap.md`
- `src/content/blog/20260508-from-ai-model-to-work-os.md`
- `src/content/blog/20260508-hokuto-yamanashi-ai-support.md`
- `src/content/blog/20260508-ma-fundamentals-smb.md`
- `src/content/blog/20260508-not-100-percent-automation.md`
- `src/content/blog/20260508-notebooklm-vs-supabase-knowledge-ai.md`
- `src/content/blog/20260508-rag-implementation-step-by-step.md`
- `src/content/blog/20260508-single-vs-multi-tenant.md`
- `src/content/blog/20260508-supabase-vs-firebase-vs-amplify.md`
- `src/content/blog/20260508-three-perspectives-business-decomposition.md`
- `src/content/blog/20260508-white-collar-entry-level-strategy.md`
- `src/content/blog/20260509-ai-monthly-thousands-yen-trap.md`
- `src/content/blog/20260509-industry-specific-demo-effective-reason.md`
- `src/content/blog/20260510-ai-agent-5-types-7-levels-matrix.md`
- `src/content/blog/20260510-ai-driven-dev-4-security-incidents.md`
- `src/content/blog/20260510-ai-mandatory-deployment-design.md`
- `src/content/blog/20260510-chatgpt-claude-gemini-file-generation-comparison.md`
- `src/content/blog/20260510-claude-code-beginner-pitfalls-11.md`
- `src/content/blog/20260510-claude-cowork-code-windows-setup-guide.md`
- `src/content/blog/20260510-codex-vs-claude-code-5-criteria.md`
- `src/content/blog/20260510-env-isolation-from-ai-agents.md`
- `src/content/blog/20260510-image-generation-model-comparison-4.md`
- `src/content/blog/20260510-vibe-coding-auth-authz-minimum-tests.md`
- `src/content/blog/20260510-workspace-agents-deployment-checklist-10.md`
- `src/content/blog/20260511-slack-email-only-ceo-ai-no-dashboard.md`
- `src/content/blog/20260517-ai-search-seo-smb-information-design.md`

## 全チェック対象記事

- `src/content/blog/20260423-business-direction.md`: OK
- `src/content/blog/20260424-ai-agent-risks-smb-guide.md`: OK
- `src/content/blog/20260424-nationwide-ai-consulting-security-action.md`: OK
- `src/content/blog/20260427-document-editor-demo-launch.md`: OK
- `src/content/blog/20260429-ai-task-decision-framework-smb.md`: OK
- `src/content/blog/20260430-cloud-db-ai-agent-for-smb.md`: OK
- `src/content/blog/20260501-ceo-ai-briefing-3-domains.md`: OK
- `src/content/blog/20260504-ai-suishinho-smb-relation.md`: OK
- `src/content/blog/20260505-ai-automation-30percent-trap.md`: OK
- `src/content/blog/20260505-ai-guidelines-checklist-smb.md`: OK
- `src/content/blog/20260505-ai-implementation-pitfalls-5.md`: OK
- `src/content/blog/20260505-ai-training-subsidy-2026.md`: OK
- `src/content/blog/20260505-approval-workflow-license-free.md`: OK
- `src/content/blog/20260505-chatai-vs-aiagent-housework.md`: OK
- `src/content/blog/20260505-free-diagnosis-report-content.md`: OK
- `src/content/blog/20260505-hallucination-business-control.md`: OK
- `src/content/blog/20260505-human-vs-ai-3-questions.md`: OK
- `src/content/blog/20260505-local-gov-ai-87percent-smb.md`: OK
- `src/content/blog/20260505-salesforce-ai-agent-3-patterns.md`: OK
- `src/content/blog/20260505-self-use-self-improve-crm.md`: OK
- `src/content/blog/20260505-small-team-ai-agent-division.md`: OK
- `src/content/blog/20260506-accounting-tax-ai-automation.md`: OK
- `src/content/blog/20260506-ai-adoption-roadmap-1-3-6-months.md`: OK
- `src/content/blog/20260506-ai-agent-harness-design-5-patterns.md`: OK
- `src/content/blog/20260506-ai-agent-vs-chatbot-vs-rag-definition.md`: OK
- `src/content/blog/20260506-ai-automation-quote-breakdown.md`: OK
- `src/content/blog/20260506-ai-automation-under-30k-budget.md`: OK
- `src/content/blog/20260506-ai-delegation-risk-and-audit.md`: OK
- `src/content/blog/20260506-ai-roi-3-indicators.md`: OK
- `src/content/blog/20260506-ai-vs-rpa-smb-choice.md`: OK
- `src/content/blog/20260506-chatgpt-claude-gemini-business-usage.md`: OK
- `src/content/blog/20260506-clinic-ai-reservation-screening.md`: OK
- `src/content/blog/20260506-construction-industry-ai-5-patterns.md`: OK
- `src/content/blog/20260506-rag-ai-business-manual.md`: OK
- `src/content/blog/20260506-restaurant-owner-ai-3-tools.md`: OK
- `src/content/blog/20260506-solo-llc-ai-agent-management-optiens.md`: OK
- `src/content/blog/20260507-ai-as-extension-of-left-brain.md`: OK
- `src/content/blog/20260507-ai-native-management-three-tier.md`: OK
- `src/content/blog/20260507-ai-orchestrator-job-role-for-smb.md`: OK
- `src/content/blog/20260507-alignment-faking-and-harness.md`: OK
- `src/content/blog/20260507-business-visualization-prerequisite-for-ai.md`: OK
- `src/content/blog/20260507-five-ai-ceos-2026-january-consensus.md`: OK
- `src/content/blog/20260507-full-automation-limit-and-orchestrator.md`: OK
- `src/content/blog/20260507-meaning-crisis-management.md`: OK
- `src/content/blog/20260507-white-collar-entry-level-disappearing.md`: OK
- `src/content/blog/20260508-5days-bootcamp-launch-analysis.md`: OK
- `src/content/blog/20260508-action-level-decomposition.md`: OK
- `src/content/blog/20260508-ai-agent-failure-patterns-7.md`: OK
- `src/content/blog/20260508-ai-complacency-not-overconfidence.md`: OK
- `src/content/blog/20260508-ai-info-quality-5-checks.md`: OK
- `src/content/blog/20260508-ai-native-management-definition.md`: OK
- `src/content/blog/20260508-ai-native-management-two-wheels.md`: OK
- `src/content/blog/20260508-alignment-faking-and-harness-design.md`: OK
- `src/content/blog/20260508-claude-code-vs-cursor-vs-copilot.md`: OK
- `src/content/blog/20260508-design-system-driven-ai.md`: OK
- `src/content/blog/20260508-disappearing-vs-resilient-jobs.md`: OK
- `src/content/blog/20260508-divide-thinking-1oku-breakthrough.md`: OK
- `src/content/blog/20260508-dx-promotion-team-failure-pattern.md`: OK
- `src/content/blog/20260508-fashion-dx-trap.md`: OK
- `src/content/blog/20260508-from-ai-model-to-work-os.md`: OK
- `src/content/blog/20260508-hokuto-yamanashi-ai-support.md`: OK
- `src/content/blog/20260508-ma-fundamentals-smb.md`: OK
- `src/content/blog/20260508-not-100-percent-automation.md`: OK
- `src/content/blog/20260508-notebooklm-vs-supabase-knowledge-ai.md`: OK
- `src/content/blog/20260508-openai-anthropic-gemini-api.md`: OK
- `src/content/blog/20260508-rag-implementation-step-by-step.md`: OK
- `src/content/blog/20260508-single-vs-multi-tenant.md`: OK
- `src/content/blog/20260508-solo-entrepreneur-era-ethics.md`: OK
- `src/content/blog/20260508-startup-idea-7-checks.md`: OK
- `src/content/blog/20260508-supabase-vs-firebase-vs-amplify.md`: OK
- `src/content/blog/20260508-three-perspectives-business-decomposition.md`: OK
- `src/content/blog/20260508-white-collar-entry-level-strategy.md`: OK
- `src/content/blog/20260509-ai-api-running-cost-calculation-guide.md`: OK
- `src/content/blog/20260509-ai-driven-development-half-year-to-2-4-months-truth.md`: OK
- `src/content/blog/20260509-ai-model-selection-guide-may-2026.md`: OK
- `src/content/blog/20260509-ai-monthly-thousands-yen-trap.md`: OK
- `src/content/blog/20260509-ai-reply-friendly-tone-low-rating-pitfall.md`: OK
- `src/content/blog/20260509-cost-priority-vs-quality-priority-30x-difference.md`: OK
- `src/content/blog/20260509-google-business-profile-api-application-approval.md`: OK
- `src/content/blog/20260509-industry-specific-demo-effective-reason.md`: OK
- `src/content/blog/20260509-new-employee-training-replaced-by-ai.md`: OK
- `src/content/blog/20260509-tabelog-no-public-api-review-monitoring.md`: OK
- `src/content/blog/20260510-ai-agent-5-types-7-levels-matrix.md`: OK
- `src/content/blog/20260510-ai-driven-dev-4-security-incidents.md`: OK
- `src/content/blog/20260510-ai-erasing-ask-senior-culture.md`: OK
- `src/content/blog/20260510-ai-mandatory-deployment-design.md`: OK
- `src/content/blog/20260510-chatgpt-claude-gemini-file-generation-comparison.md`: OK
- `src/content/blog/20260510-claude-code-beginner-pitfalls-11.md`: OK
- `src/content/blog/20260510-claude-code-codespaces-setup-guide.md`: OK
- `src/content/blog/20260510-claude-cowork-code-windows-setup-guide.md`: OK
- `src/content/blog/20260510-codex-vs-claude-code-5-criteria.md`: OK
- `src/content/blog/20260510-env-isolation-from-ai-agents.md`: OK
- `src/content/blog/20260510-image-generation-model-comparison-4.md`: OK
- `src/content/blog/20260510-instagram-graph-api-app-review-guide.md`: OK
- `src/content/blog/20260510-no-rogue-skills-operational-design.md`: OK
- `src/content/blog/20260510-plan-mode-brainstorming-practical-guide.md`: OK
- `src/content/blog/20260510-trust-but-verify-ai-numbers.md`: OK
- `src/content/blog/20260510-uv-bypass-safe-ai-development.md`: OK
- `src/content/blog/20260510-vibe-coding-auth-authz-minimum-tests.md`: OK
- `src/content/blog/20260510-workspace-agents-deployment-checklist-10.md`: OK
- `src/content/blog/20260511-ceo-morning-15-minutes-ai-briefing.md`: OK
- `src/content/blog/20260511-claude-code-5-integration-methods.md`: OK
- `src/content/blog/20260511-claude-code-vague-request-failure.md`: OK
- `src/content/blog/20260511-claude-md-session-knowledge-persistence.md`: OK
- `src/content/blog/20260511-feedback-loop-80-percent-ai-system-evolution.md`: OK
- `src/content/blog/20260511-manager-ai-dashboard-sales-time-5-percent.md`: OK
- `src/content/blog/20260511-mcp-vs-cli-tradeoff-agent-integration.md`: OK
- `src/content/blog/20260511-signal-db-attending-all-meetings.md`: OK
- `src/content/blog/20260511-slack-email-only-ceo-ai-no-dashboard.md`: OK
- `src/content/blog/20260511-video-to-sns-full-automation-5-methods.md`: OK
- `src/content/blog/20260512-vibe-coding-security-utopia-lessons.md`: OK
- `src/content/blog/20260513-ai-vendor-on-site-shift.md`: OK
- `src/content/blog/20260513-claude-managed-agent-5-components.md`: OK
- `src/content/blog/20260514-human-touch-ai-operations-roadmap.md`: OK
- `src/content/blog/20260515-context-first-local-llm.md`: OK
- `src/content/blog/20260515-dx-fieldwork-profit.md`: OK
- `src/content/blog/20260516-ai-coding-refactor-technical-debt.md`: OK
- `src/content/blog/20260516-ai-governance-context-management.md`: OK
- `src/content/blog/20260516-ai-interface-shift-pointer-voice-security.md`: OK
- `src/content/blog/20260516-cheap-database-d1-turso-sqlite.md`: OK
- `src/content/blog/20260517-ai-design-collaboration-rules.md`: OK
- `src/content/blog/20260517-ai-search-seo-smb-information-design.md`: OK
- `src/content/blog/20260517-category-theory-abstraction-programmers.md`: OK
- `src/content/blog/_project-status.md`: OK
- `src/content/blog/a-type-welfare-hydroponics-wages.md`: OK
- `src/content/blog/abandoned-school-agriculture-revitalization.md`: OK
- `src/content/blog/ai-agriculture-revolution-2025.md`: OK
- `src/content/blog/ai-plant-health-image-recognition.md`: OK
- `src/content/blog/b-type-welfare-indoor-hydroponics-model.md`: OK
- `src/content/blog/food-miles-local-production-indoor-farming.md`: OK
- `src/content/blog/food-security-japan-2030.md`: OK
- `src/content/blog/generative-ai-business-2025.md`: OK
- `src/content/blog/hydroponics-automation-global-market-2026.md`: OK
- `src/content/blog/hydroponics-herb-sales-channel-strategy.md`: OK
- `src/content/blog/hydroponics-nutrient-ec-ph-management.md`: OK
- `src/content/blog/hydroponics-startup-cost-breakeven.md`: OK
- `src/content/blog/hydroponics-water-efficiency.md`: OK
- `src/content/blog/iot-ai-hydroponic-herb-production.md`: OK
- `src/content/blog/led-light-spectrum-herb-cultivation.md`: OK
- `src/content/blog/mcp-model-context-protocol-farm-control.md`: OK
- `src/content/blog/microgreens-business-indoor-farming-2026.md`: OK
- `src/content/blog/mqtt-supabase-farm-dashboard.md`: OK
- `src/content/blog/official-website-launch.md`: OK
- `src/content/blog/optiens-company-founded-april-2026.md`: OK
- `src/content/blog/optiens-two-weeks-after-founding.md`: OK
- `src/content/blog/welfare-hydroponics-social-impact.md`: OK
- `src/content/blog/zigbee-wifi-lora-agriculture-iot-protocol.md`: OK

## 参照元

- `AGENTS.md`
- `executive/ai-consulting/blog-service-claim-rules.md`
- `scripts/check-blog-service-claims.mjs`
