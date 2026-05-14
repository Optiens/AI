/**
 * Paid AI diagnosis report processor.
 *
 * Flow:
 * 1. Receive a paid diagnosis lead from the admin API or a database trigger.
 * 2. Generate a detailed paid report plan with OpenAI.
 * 3. Copy the paid Google Slides template and replace all {{paid_xxx}} tokens.
 * 4. Share the Slides deck, email the customer, and mark the lead as report_sent.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";
import OpenAI from "https://esm.sh/openai@4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const GOOGLE_SERVICE_ACCOUNT_EMAIL =
  Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL") || "";
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY =
  Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY") || "";
const GOOGLE_SLIDES_PAID_TEMPLATE_ID =
  Deno.env.get("GOOGLE_SLIDES_PAID_TEMPLATE_ID") ||
  "1DzM-D5sncQNFpvre0b785NdJK2MF4u4fta8o27SLe54";
const GOOGLE_SLIDES_OUTPUT_FOLDER_ID =
  Deno.env.get("GOOGLE_SLIDES_OUTPUT_FOLDER_ID") || "0AP-9nfOx7k3HUk9PVA";
const FROM_EMAIL = Deno.env.get("CONTACT_FROM") || "no-reply@optiens.com";
const ADMIN_EMAIL =
  Deno.env.get("CONTACT_TO") || Deno.env.get("GMAIL_USER") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://optiens.com").replace(
  /\/$/,
  "",
);
const MTG_BOOKING_URL =
  Deno.env.get("PAID_MTG_BOOKING_URL") ||
  Deno.env.get("GOOGLE_CALENDAR_BOOKING_URL") ||
  "";
const OPENAI_MODEL =
  Deno.env.get("PAID_DIAGNOSIS_MODEL") ||
  Deno.env.get("OPENAI_MODEL") ||
  "gpt-5.5";
const FORBIDDEN_REPORT_TERMS = [
  "宇宙",
  "宇宙農業",
  "医療機関",
  "防災拠点",
  "孤立環境",
  "離島",
  "船舶",
  "地下施設",
  "家庭用ガーデニング",
  "食育教室",
  "食べチョク",
  "産直EC",
  "ビニールハウス",
  "SaaSプラットフォーム販売",
];

const DEFAULT_INITIAL_COST_RANGE = "¥270,000〜¥560,000";
const DEFAULT_INITIAL_COST_BREAKDOWN = [
  "・1業務MVP実装: ¥270,000〜360,000",
  "・2業務実装: ¥420,000〜560,000",
  "・3業務/外部連携多め: ¥600,000〜800,000+",
  "・要件整理、実装、通知連携、検証、初回運用手順書を含む",
  "※ 正式見積は60分MTGで対象業務・連携先・データ状態を確認して確定",
].join("\n");

const DEMO_LINKS = [
  {
    label: "問い合わせ自動振り分けデモ",
    path: "/inquiry-routing",
    keywords: ["問い合わせ", "一次回答", "FAQ", "顧客対応", "メール対応"],
  },
  {
    label: "見積書ドラフト生成デモ",
    path: "/quote-generator",
    keywords: ["見積", "提案書", "見積書", "提案ドラフト"],
  },
  {
    label: "社内データ検索デモ",
    path: "/data-search",
    keywords: ["社内検索", "ナレッジ", "RAG", "マニュアル", "文書検索"],
  },
  {
    label: "承認ワークフローデモ",
    path: "/approval-workflow",
    keywords: ["承認", "稟議", "ワークフロー"],
  },
  {
    label: "カスタム業務管理画面デモ",
    path: "/custom-management",
    keywords: ["管理画面", "業務管理", "案件管理", "進捗管理"],
  },
  {
    label: "口コミ監視・返信下書きデモ",
    path: "/review-monitor",
    keywords: ["口コミ", "レビュー", "返信下書き", "SNS"],
  },
  {
    label: "契約書・社内文書レビュー支援デモ",
    path: "/document-review",
    keywords: ["契約書", "文書レビュー", "社内文書", "規程"],
  },
];

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

type JsonMap = Record<string, unknown>;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let lead: any = null;
  try {
    const missing = requiredEnvMissing();
    if (missing.length > 0) {
      return json(
        { error: "Missing required environment variables", missing },
        500,
      );
    }

    const body = await req.json().catch(() => ({}));
    lead = body?.record || body?.lead || null;

    if (!lead && body?.id) {
      lead = await fetchLead(String(body.id));
    } else if (lead?.id) {
      lead = (await fetchLead(String(lead.id))) || lead;
    }

    if (!lead?.id) {
      return json({ error: "Lead not found" }, 400);
    }

    const force = Boolean(body?.force);
    const status = String(lead.status || "");
    if (
      !force &&
      ["report_sent", "sent", "paid_report"].includes(status) &&
      lead.slides_url
    ) {
      return json({
        ok: true,
        skipped: true,
        reason: "already_sent",
        slides_url: lead.slides_url,
      });
    }
    if (!force && !["paid", "report_created"].includes(status)) {
      return json({
        ok: true,
        skipped: true,
        reason: `status ${status} is not ready`,
      });
    }

    if (force) {
      await updateLead(lead.id, {
        status: "processing",
        last_error: null,
      });
    } else {
      const claimed = await claimLeadForProcessing(lead.id);
      if (!claimed) {
        return json({
          ok: true,
          skipped: true,
          reason: "already_processing_or_not_ready",
        });
      }
    }

    const report = await generatePaidReport(lead);
    const validationErrors = validateReport(report);
    if (validationErrors.length > 0) {
      throw new Error(
        `Paid report validation failed: ${validationErrors.join(", ")}`,
      );
    }

    const slidesUrl = await createPaidSlides(lead, report);
    await sendPaidReportEmail(lead, slidesUrl);
    await notifyAdmin(
      "有償版レポートを送付しました",
      `申込番号: ${lead.application_id || lead.id}\n企業: ${lead.company_name || ""}\nURL: ${slidesUrl}`,
    );

    await updateLead(lead.id, {
      status: "report_sent",
      slides_url: slidesUrl,
      sent_at: new Date().toISOString(),
      report_sent_at: new Date().toISOString(),
      last_error: null,
    });

    return json({ ok: true, slides_url: slidesUrl });
  } catch (err) {
    console.error("[process-paid-diagnosis] error:", err);
    if (lead?.id) {
      await updateLead(lead.id, {
        status: "manual_review",
        last_error: errorMessage(err).slice(0, 4000),
      }).catch((e) =>
        console.error("[process-paid-diagnosis] status update failed:", e),
      );
    }
    await notifyAdmin(
      "有償版レポート生成に失敗しました",
      `申込番号: ${lead?.application_id || lead?.id || "(unknown)"}\n企業: ${lead?.company_name || ""}\nエラー: ${errorMessage(err)}`,
    ).catch(() => {});
    return json({ error: errorMessage(err) }, 500);
  }
});

function requiredEnvMissing(): string[] {
  const checks: Record<string, string> = {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY,
    OPENAI_API_KEY,
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  };
  return Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

async function fetchLead(id: string) {
  const { data, error } = await supabase!
    .from("diagnosis_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateLead(id: string, updates: JsonMap) {
  const { error } = await supabase!
    .from("diagnosis_leads")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

async function claimLeadForProcessing(id: string) {
  const { data, error } = await supabase!
    .from("diagnosis_leads")
    .update({
      status: "processing",
      last_error: null,
    })
    .eq("id", id)
    .in("status", ["paid", "report_created"])
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function generatePaidReport(lead: any) {
  const prompt = buildPaidReportPrompt(lead);
  const completion = await openai!.chat.completions.create({
    model: OPENAI_MODEL,
    max_completion_tokens: 7000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior Japanese AI operations consultant writing a paid report for small and medium-sized businesses. Return only valid JSON. Be specific, quantitative, and conservative. Do not mention SaaS resale, space agriculture, medical institutions, disaster bases, isolated facilities, home gardening, consumer herb ecommerce, or greenhouse conversion.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return normalizeReport(parsed, lead);
}

function buildPaidReportPrompt(lead: any): string {
  return `
以下の申込情報をもとに、有償版「詳細AI活用診断レポート + 60分オンラインMTG」用の詳細レポートJSONを作成してください。

有償版の品質基準:
- 汎用的なAI紹介ではなく、この会社の業務・規模・利用中ツールに合わせた提案にする。
- 7件の施策を、優先度・削減時間・削減額・根拠・前提条件つきで出す。
- 導入前後フロー、簡易アーキテクチャ、3段階ロードマップ、ROI、概算費用、リスクを含める。
- 数値は推定でよいが、算定根拠を必ず書く。過大な断定は禁止。
- 補助金は候補名と確認ポイントにとどめ、最新公募確認が必要であることが伝わる表現にする。
- 概算費用は安売りしない。1業務MVPは¥270,000〜360,000、2業務実装は¥420,000〜560,000、3業務以上や外部連携が多い場合は¥600,000〜800,000+を目安にする。
- 実装期間は、1業務なら3〜4週間、1〜2業務なら4〜6週間を目安にする。
- 議事録要約・アクション抽出では、第一候補をCircleback等の高精度な会議文字起こし/議事録SaaSにし、Webhookで連携できる構成を優先する。OpenAIのgpt-4o-transcribe/Whisper系APIは、独自UIや自社録音データ処理を作る場合の選択肢として扱う。
- リスクの「発生可能性」に単に「中」を並べない。顧客の導入意欲を下げないよう、「初期対策で低減」「運用で管理」「重点管理」など、対策込みの管理方針として表現する。
- 対応する公開デモがある施策は、提案内に「関連デモ: https://optiens.com/...」を含める。
- 本レポートはフォーム入力をもとにAIが自動生成し、機械的な品質ゲートを通過したものを自動送付する前提。人による確認で作成したとは書かない。
- 出力は日本語。JSON以外の説明は不要。

返すJSONのキー:
{
  "current_analysis_left": string,
  "current_analysis_right": string,
  "executive_summary": string,
  "initiatives": [{"title": string, "desc": string}],
  "proposals": [{
    "area": string,
    "priority": "A"|"B"|"C",
    "priority_basis": string,
    "critical": "高"|"中"|"低",
    "detail": string,
    "overview": string,
    "flow_before": string,
    "flow_after": string,
    "architecture": string,
    "prereq": string,
    "hours_per_month": number,
    "monthly_value_yen": number,
    "effect_basis": string
  }],
  "roadmap": [{"actions": string, "kpi": string}],
  "cost_initial_range": string,
  "cost_initial_breakdown": string,
  "cost_monthly_total": string,
  "cost_monthly_breakdown": string,
  "compare_rows": [{"a": string, "b": string, "c": string}],
  "subsidies": [{"name": string, "period": string, "amount": string, "rate": string, "fit": string}],
  "risks": [{"name": string, "impact": string, "likelihood": string, "mitigation": string}],
  "user_concern_quote": string,
  "user_concern_answer": string
}

申込情報:
- 企業名: ${safeText(lead.company_name)}
- 担当者名: ${safeText(lead.person_name)}
- 業種: ${safeText(lead.industry)}
- 従業員数: ${safeText(lead.employee_count)}
- 事業内容: ${safeText(lead.business_description)}
- 日常で時間がかかる業務: ${safeText(lead.daily_tasks)}
- 現在使用中のITツール: ${safeText(lead.current_tools)}
- 創業/設立: ${safeText(lead.business_age)}
- 営業エリア: ${safeText(lead.service_area)}
- 顧客層: ${safeText(lead.target_customer)}
- 売上規模感: ${safeText(lead.annual_revenue_range)}
- 検討時期: ${safeText(lead.decision_timeline)}
- 過去のIT/自動化経験: ${safeText(lead.past_it_experience)}
- 自由記述/相談: ${safeText(lead.free_text)}
`.trim();
}

function normalizeReport(input: any, lead: any) {
  const proposals = padArray(input?.proposals, 7, (idx) =>
    defaultProposal(idx, lead),
  )
    .slice(0, 7)
    .map((p: any, idx: number) => normalizeProposal(p, idx, lead));

  const initiatives = padArray(input?.initiatives, 3, (idx) => ({
    title: proposals[idx]?.area || `優先施策 ${idx + 1}`,
    desc:
      proposals[idx]?.overview ||
      proposals[idx]?.detail ||
      "入力情報に基づく優先施策です。",
  })).slice(0, 3);

  return {
    current_analysis_left: textOr(
      input?.current_analysis_left,
      buildCurrentSummary(lead),
    ),
    current_analysis_right: textOr(
      input?.current_analysis_right,
      buildToolSummary(lead),
    ),
    executive_summary: textOr(
      input?.executive_summary,
      buildExecutiveSummary(proposals),
    ),
    initiatives: initiatives.map((x: any) => ({
      title: textOr(x?.title, "優先施策"),
      desc: textOr(x?.desc, "業務負荷の高い領域から段階的に自動化します。"),
    })),
    proposals,
    roadmap: padArray(input?.roadmap, 3, (idx) =>
      defaultRoadmap(idx, proposals),
    )
      .slice(0, 3)
      .map((r: any, idx: number) => ({
        actions: textOr(r?.actions, defaultRoadmap(idx, proposals).actions),
        kpi: textOr(r?.kpi, defaultRoadmap(idx, proposals).kpi),
      })),
    cost_initial_range: textOr(
      input?.cost_initial_range,
      DEFAULT_INITIAL_COST_RANGE,
    ),
    cost_initial_breakdown: textOr(
      input?.cost_initial_breakdown,
      DEFAULT_INITIAL_COST_BREAKDOWN,
    ),
    cost_monthly_total: textOr(
      input?.cost_monthly_total,
      "¥18,000〜¥45,000/月",
    ),
    cost_monthly_breakdown: textOr(
      input?.cost_monthly_breakdown,
      "AI API、クラウド、保守・改善MTG、軽微な修正対応。",
    ),
    compare_rows: padArray(input?.compare_rows, 4, defaultCompareRow)
      .slice(0, 4)
      .map((r: any, idx: number) => ({
        a: textOr(r?.a, defaultCompareRow(idx).a),
        b: textOr(r?.b, defaultCompareRow(idx).b),
        c: textOr(r?.c, defaultCompareRow(idx).c),
      })),
    subsidies: padArray(input?.subsidies, 3, defaultSubsidy)
      .slice(0, 3)
      .map((s: any, idx: number) => ({
        name: textOr(s?.name, defaultSubsidy(idx).name),
        period: textOr(s?.period, defaultSubsidy(idx).period),
        amount: textOr(s?.amount, defaultSubsidy(idx).amount),
        rate: textOr(s?.rate, defaultSubsidy(idx).rate),
        fit: textOr(s?.fit, defaultSubsidy(idx).fit),
      })),
    risks: padArray(input?.risks, 4, defaultRisk)
      .slice(0, 4)
      .map((r: any, idx: number) => ({
        name: textOr(r?.name, defaultRisk(idx).name),
        impact: textOr(r?.impact, defaultRisk(idx).impact),
        likelihood: normalizeRiskManagementLabel(
          textOr(r?.likelihood, defaultRisk(idx).likelihood),
        ),
        mitigation: textOr(r?.mitigation, defaultRisk(idx).mitigation),
      })),
    user_concern_quote: textOr(
      input?.user_concern_quote,
      lead.free_text || "何から始めるべきかを整理したい。",
    ),
    user_concern_answer: textOr(
      input?.user_concern_answer,
      buildConcernAnswer(proposals),
    ),
  };
}

function normalizeProposal(p: any, idx: number, lead: any) {
  const fallback = defaultProposal(idx, lead);
  const hours = Math.max(
    4,
    Math.min(80, Number(p?.hours_per_month) || fallback.hours_per_month),
  );
  const monthlyValue = Math.max(
    8000,
    Math.min(240000, Number(p?.monthly_value_yen) || hours * 2000),
  );
  const proposal = {
    area: textOr(p?.area, fallback.area),
    priority: ["A", "B", "C"].includes(String(p?.priority))
      ? String(p.priority)
      : fallback.priority,
    priority_basis: textOr(p?.priority_basis, fallback.priority_basis),
    critical: ["高", "中", "低"].includes(String(p?.critical))
      ? String(p.critical)
      : fallback.critical,
    detail: textOr(p?.detail, fallback.detail),
    overview: textOr(p?.overview, fallback.overview),
    flow_before: textOr(p?.flow_before, fallback.flow_before),
    flow_after: textOr(p?.flow_after, fallback.flow_after),
    architecture: textOr(p?.architecture, fallback.architecture),
    prereq: textOr(p?.prereq, fallback.prereq),
    hours_per_month: hours,
    monthly_value_yen: monthlyValue,
    effect_basis: textOr(p?.effect_basis, fallback.effect_basis),
  };
  preferCirclebackForMeetingProposal(proposal);
  const demo = findDemoLink(proposal);
  if (demo) {
    proposal.overview = appendDemoLink(proposal.overview, demo);
  }
  return proposal;
}

function preferCirclebackForMeetingProposal(proposal: any) {
  const haystack = [
    proposal.area,
    proposal.detail,
    proposal.overview,
    proposal.architecture,
  ].join(" ");
  if (
    !haystack.includes("議事録") &&
    !haystack.includes("会議") &&
    !haystack.includes("文字起こし")
  )
    return;

  proposal.architecture =
    "[Zoom/Google Meet] → [Circleback等: 文字起こし + 話者分離 + 議事録] → [Webhook] → [AI API: アクション抽出] → [Slack / Google Tasks]";
  const note =
    "議事録用途はCircleback等の会議文字起こし/議事録SaaSを第一候補にし、独自UIや自社録音処理が必要な場合のみgpt-4o-transcribeを検討。";
  if (!proposal.prereq.includes("Circleback")) {
    proposal.prereq = `${proposal.prereq}\n${note}`;
  }
}

function findDemoLink(proposal: any) {
  const haystack = [
    proposal.area,
    proposal.detail,
    proposal.overview,
    proposal.flow_before,
    proposal.flow_after,
    proposal.architecture,
    proposal.prereq,
  ].join(" ");
  return DEMO_LINKS.find((demo) =>
    demo.keywords.some((keyword) => haystack.includes(keyword)),
  );
}

function appendDemoLink(text: string, demo: { label: string; path: string }) {
  const url = `${SITE_URL}${demo.path}`;
  if (text.includes(url) || text.includes("関連デモ")) return text;
  return `${text}\n関連デモ: ${demo.label}（${url}）`;
}

function normalizeRiskManagementLabel(value: string) {
  const text = safeText(value);
  if (!text) return "初期対策で低減";
  if (text === "高") return "重点管理";
  if (text === "中") return "初期対策で低減";
  if (text === "低") return "低リスク";
  if (text.includes("高") && !text.includes("低")) return "重点管理";
  if (text.includes("中")) return "初期対策で低減";
  return text;
}

function validateReport(report: any): string[] {
  const errors: string[] = [];
  if (!report.executive_summary) errors.push("executive_summary");
  if (!Array.isArray(report.proposals) || report.proposals.length < 7)
    errors.push("proposals");
  if (!Array.isArray(report.roadmap) || report.roadmap.length < 3)
    errors.push("roadmap");
  if (!Array.isArray(report.subsidies) || report.subsidies.length < 3)
    errors.push("subsidies");
  const serialized = JSON.stringify(report);
  if (serialized.includes("{{"))
    errors.push("unreplaced placeholder in AI report");
  for (const term of FORBIDDEN_REPORT_TERMS) {
    if (serialized.includes(term)) errors.push(`forbidden term: ${term}`);
  }
  if (Array.isArray(report.proposals)) {
    report.proposals.slice(0, 7).forEach((proposal: any, idx: number) => {
      const n = idx + 1;
      if (!textOr(proposal?.area, "")) errors.push(`proposal_${n}_area`);
      if (!textOr(proposal?.detail, "")) errors.push(`proposal_${n}_detail`);
      if (!textOr(proposal?.architecture, ""))
        errors.push(`proposal_${n}_architecture`);
      if (!textOr(proposal?.effect_basis, ""))
        errors.push(`proposal_${n}_effect_basis`);
      if ((Number(proposal?.hours_per_month) || 0) <= 0)
        errors.push(`proposal_${n}_hours`);
      if ((Number(proposal?.monthly_value_yen) || 0) <= 0)
        errors.push(`proposal_${n}_monthly_value`);
    });
  }
  return errors;
}

async function createPaidSlides(lead: any, report: any) {
  const token = await getGoogleAccessToken();
  const name = `Optiens 詳細AI活用診断レポート_${lead.company_name || lead.application_id || lead.id}`;
  const copyRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${GOOGLE_SLIDES_PAID_TEMPLATE_ID}/copy?supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        parents: GOOGLE_SLIDES_OUTPUT_FOLDER_ID
          ? [GOOGLE_SLIDES_OUTPUT_FOLDER_ID]
          : undefined,
      }),
    },
  );
  if (!copyRes.ok)
    throw new Error(`Google Drive copy failed: ${await copyRes.text()}`);
  const copied = await copyRes.json();
  const presentationId = copied.id;

  const requests = buildReplacementRequests(lead, report);
  const updateRes = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    },
  );
  if (!updateRes.ok)
    throw new Error(
      `Google Slides batchUpdate failed: ${await updateRes.text()}`,
    );

  const shareRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${presentationId}/permissions?supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    },
  );
  if (!shareRes.ok)
    throw new Error(`Google Drive share failed: ${await shareRes.text()}`);

  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

function buildReplacementRequests(lead: any, report: any) {
  const replacements = buildReplacements(lead, report);
  return Object.entries(replacements).map(([key, value]) => ({
    replaceAllText: {
      containsText: { text: `{{${key}}}`, matchCase: true },
      replaceText: truncate(String(value || ""), 900),
    },
  }));
}

function buildReplacements(lead: any, report: any): Record<string, string> {
  const totalMonthly = report.proposals.reduce(
    (sum: number, p: any) => sum + (Number(p.monthly_value_yen) || 0),
    0,
  );
  const totalHours = report.proposals.reduce(
    (sum: number, p: any) => sum + (Number(p.hours_per_month) || 0),
    0,
  );
  const annual = totalMonthly * 12;
  const threeYear = annual * 3;
  const map: Record<string, string> = {
    paid_customer_name: textOr(lead.company_name, "お客様"),
    paid_diagnosis_date: formatDate(new Date()),
    paid_current_analysis_left: report.current_analysis_left,
    paid_current_analysis_right: report.current_analysis_right,
    paid_summary_value_yen: formatNumber(totalMonthly),
    paid_summary_hours: formatNumber(totalHours),
    paid_summary_initial_cost: report.cost_initial_range,
    paid_summary_monthly_cost: report.cost_monthly_total,
    paid_summary_period: "4〜6週間",
    paid_executive_summary: report.executive_summary,
    paid_roi_total_yen: formatNumber(totalMonthly),
    paid_roi_annual_yen: formatNumber(annual),
    paid_roi_three_year_yen: formatNumber(threeYear),
    paid_cost_initial_range: report.cost_initial_range,
    paid_cost_initial_breakdown: report.cost_initial_breakdown,
    paid_cost_monthly_total: report.cost_monthly_total,
    paid_cost_monthly_breakdown: report.cost_monthly_breakdown,
    paid_subsidy_search_date: formatDate(new Date()),
    paid_user_concern_quote: report.user_concern_quote,
    paid_user_concern_answer: report.user_concern_answer,
  };

  report.initiatives.forEach((item: any, idx: number) => {
    const n = idx + 1;
    map[`paid_initiative_${n}_title`] = item.title;
    map[`paid_initiative_${n}_desc`] = item.desc;
  });

  report.proposals.forEach((p: any, idx: number) => {
    const n = idx + 1;
    map[`paid_proposal_priority_${n}`] = p.priority;
    map[`paid_proposal_area_${n}`] = p.area;
    map[`paid_proposal_effect_${n}`] =
      `月${formatNumber(p.hours_per_month)}時間 / ¥${formatNumber(p.monthly_value_yen)}`;
    map[`paid_proposal_effect_basis_${n}`] = p.effect_basis;
    map[`paid_proposal_critical_${n}`] = p.critical;
    map[`paid_proposal_detail_${n}`] = p.detail;
    map[`paid_proposal_priority_basis_${n}`] = p.priority_basis;
    map[`paid_proposal_prereq_${n}`] = p.prereq;
    map[`paid_proposal_overview_${n}`] = p.overview;
    map[`paid_proposal_flow_before_${n}`] = p.flow_before;
    map[`paid_proposal_flow_after_${n}`] = p.flow_after;
    map[`paid_proposal_architecture_${n}`] = p.architecture;
    map[`paid_roi_no_${n}`] = String(n);
    map[`paid_roi_area_${n}`] = p.area;
    map[`paid_roi_hours_${n}`] = `${formatNumber(p.hours_per_month)}h`;
    map[`paid_roi_yen_${n}`] = `¥${formatNumber(p.monthly_value_yen)}`;
    map[`paid_roi_basis_${n}`] = p.effect_basis;
  });

  report.roadmap.forEach((r: any, idx: number) => {
    const key = ["p1", "p2", "p3"][idx];
    map[`paid_roadmap_${key}_actions`] = r.actions;
    map[`paid_roadmap_${key}_kpi`] = r.kpi;
  });

  report.compare_rows.forEach((r: any, idx: number) => {
    const n = idx + 1;
    map[`paid_compare_${n}_a`] = r.a;
    map[`paid_compare_${n}_b`] = r.b;
    map[`paid_compare_${n}_c`] = r.c;
  });

  report.subsidies.forEach((s: any, idx: number) => {
    const n = idx + 1;
    map[`paid_subsidy_name_${n}`] = s.name;
    map[`paid_subsidy_period_${n}`] = s.period;
    map[`paid_subsidy_amount_${n}`] = s.amount;
    map[`paid_subsidy_rate_${n}`] = s.rate;
    map[`paid_subsidy_fit_${n}`] = s.fit;
  });

  report.risks.forEach((r: any, idx: number) => {
    const n = idx + 1;
    map[`paid_risk_name_${n}`] = r.name;
    map[`paid_risk_impact_${n}`] = r.impact;
    map[`paid_risk_likelihood_${n}`] = r.likelihood;
    map[`paid_risk_mitigation_${n}`] = r.mitigation;
  });

  return map;
}

async function sendPaidReportEmail(lead: any, slidesUrl: string) {
  const bookingText = MTG_BOOKING_URL
    ? `60分オンラインMTGの日程調整はこちらからお願いいたします。\n${MTG_BOOKING_URL}`
    : "60分オンラインMTGの日程は、このメールへのご返信で候補日時を2〜3つお知らせください。";
  const bookingHtml = MTG_BOOKING_URL
    ? `<p style="margin:20px 0;"><a href="${escapeAttr(MTG_BOOKING_URL)}" style="display:inline-block;padding:10px 18px;background:#E48A95;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;">60分MTGの日程を調整する</a></p>`
    : "<p>60分オンラインMTGの日程は、このメールへのご返信で候補日時を2〜3つお知らせください。</p>";
  const appId = lead.application_id || lead.id;
  const text = `${lead.company_name || ""} ${lead.person_name || ""} 様

合同会社Optiensです。
詳細AI活用診断レポートが完成しました。

■ レポートURL
${slidesUrl}

${bookingText}

■ 申込番号
${appId}

レポートは Google Slides でご覧いただけます。
内容をご確認のうえ、MTGでは優先順位・実装可否・概算費用の前提を一緒に整理します。

合同会社Optiens
${SITE_URL}
`;

  const html = `<div style="font-family:'Noto Sans JP',Arial,sans-serif;line-height:1.8;color:#182033;max-width:640px;">
<p>${escapeHtml(lead.company_name || "")}<br/>${escapeHtml(lead.person_name || "")} 様</p>
<p>合同会社Optiensです。<br/>詳細AI活用診断レポートが完成しました。</p>
<p style="margin:24px 0;">
  <a href="${escapeAttr(slidesUrl)}" style="display:inline-block;padding:12px 22px;background:#1F3A93;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;">詳細レポートを開く</a>
</p>
<p style="font-size:13px;color:#5c667a;">レポートは Google Slides URL でお届けしています。スマートフォン・PCのブラウザでご覧いただけます。</p>
${bookingHtml}
<table style="border-collapse:collapse;width:100%;margin:20px 0;border:1px solid #d9deea;">
  <tr><td style="padding:8px 12px;background:#eef2ff;font-weight:700;width:120px;">申込番号</td><td style="padding:8px 12px;font-family:monospace;">${escapeHtml(appId)}</td></tr>
</table>
<p>MTGでは、優先順位・実装可否・概算費用の前提を一緒に整理します。</p>
<hr style="border:none;border-top:1px solid #d9deea;margin:28px 0;"/>
<p style="font-size:12px;color:#7c8496;">合同会社Optiens<br/><a href="${SITE_URL}">${SITE_URL}</a></p>
</div>`;

  await resend!.emails.send({
    from: `Optiens <${FROM_EMAIL}>`,
    to: [lead.email],
    subject: `【Optiens】詳細AI活用診断レポートが完成しました（申込番号: ${appId}）`,
    text,
    html,
  });
}

async function notifyAdmin(subject: string, body: string) {
  if (!resend || !ADMIN_EMAIL) return;
  await resend.emails.send({
    from: `Optiens System <${FROM_EMAIL}>`,
    to: [ADMIN_EMAIL],
    subject: `[Optiens Paid Diagnosis] ${subject}`,
    text: body,
  });
}

async function getGoogleAccessToken(): Promise<string> {
  const jwt = await createJWT();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`OAuth failed: ${await res.text()}`);
  const { access_token } = await res.json();
  return access_token;
}

async function createJWT(): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope:
      "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const pemContents = GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;
}

function base64UrlJson(obj: unknown) {
  return btoa(JSON.stringify(obj))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlBytes(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function defaultProposal(idx: number, lead: any) {
  const tasks =
    safeText(lead.daily_tasks) || "問い合わせ対応、見積作成、日報・集計";
  const defaults = [
    ["問い合わせ一次回答とFAQ更新", "A", "高", 28],
    ["見積・提案書ドラフト生成", "A", "高", 24],
    ["日報・議事録・タスク化の自動化", "A", "中", 20],
    ["顧客情報と対応履歴の整理", "B", "中", 16],
    ["予約・日程調整・リマインド自動化", "B", "中", 14],
    ["請求・経理前処理の半自動化", "B", "中", 12],
    ["週次KPIレポート自動生成", "C", "低", 10],
  ];
  const [area, priority, critical, hours] = defaults[idx] || defaults[0];
  return {
    area,
    priority,
    priority_basis: `${tasks} のうち反復性が高く、初期データが少なくても効果検証しやすいため。`,
    critical,
    detail: `${area}を対象に、入力情報の収集、AIによる下書き生成、担当者確認、記録保存までを一連の流れにします。`,
    overview: `人が毎回ゼロから作っている文面・表・記録を、既存ツールとAIで下書き化します。`,
    flow_before: "担当者が情報を探す → 手入力で作成 → 確認 → 保存・共有",
    flow_after:
      "フォーム/既存データを入力 → AIが下書き生成 → 担当者が確認 → 自動で保存・共有",
    architecture:
      "Google Workspace/メール/表計算 → 自動化スクリプト → AI API → 共有フォルダ/管理表",
    prereq:
      "既存データの置き場所、承認者、出力フォーマットを最初に固定すること。",
    hours_per_month: hours,
    monthly_value_yen: hours * 2000,
    effect_basis: `月${hours}時間 × 想定時給2,000円。初期は実績ログで補正します。`,
  };
}

function defaultRoadmap(idx: number, proposals: any[]) {
  const rows = [
    {
      actions: `1〜2週目: ${proposals[0]?.area}と${proposals[1]?.area}を対象に要件定義、入力項目、承認フロー、出力テンプレートを固める。`,
      kpi: "対象業務の現状工数、下書き精度、修正回数を計測できる状態にする。",
    },
    {
      actions: `3〜6週目: 優先度Aの施策を小さく実装し、実データで検証。手戻りが多い箇所をプロンプト・入力形式・確認手順で調整する。`,
      kpi: "月間30時間以上の削減見込み、確認後の再修正率20%以下。",
    },
    {
      actions:
        "7週目以降: 優先度B/Cへ拡張し、週次KPIと改善MTGで運用品質を維持する。",
      kpi: "月次削減額が運用費を上回る状態を継続。担当者が自走できる手順書を整備。",
    },
  ];
  return rows[idx] || rows[0];
}

function defaultCompareRow(idx: number) {
  const rows = [
    {
      a: "Supabase\nDB・認証・Storageを一括管理。小規模RAGにも展開しやすい。",
      b: "NoSQL/軽量DB\nチャット型や単純な台帳向け。",
      c: "既存クラウドDB\n社内基盤が決まっている場合に検討。",
    },
    {
      a: "軽量LLM API\n分類・定型回答など高頻度処理向け。",
      b: "中堅LLM API\n要約・提案書下書きなど品質重視。",
      c: "上位LLM API\n重要提案や複雑な判断補助向け。",
    },
    {
      a: "Circleback等\n会議録・話者分離・要約・Webhook連携を優先。",
      b: "gpt-4o-transcribe\n独自UIや自社録音処理を作る場合。",
      c: "クラウド音声認識\n既存クラウド統合を優先する場合。",
    },
    {
      a: "Vercel/Supabase Edge\n小規模Webアプリと即時デプロイ向け。",
      b: "軽量サーバレス\n低レイテンシAPI向け。",
      c: "既存クラウド\n権限管理や社内統制が重い場合。",
    },
  ];
  return rows[idx] || rows[0];
}

function defaultSubsidy(idx: number) {
  const rows = [
    {
      name: "小規模事業者持続化補助金",
      period: "最新公募を要確認",
      amount: "販路開拓・業務効率化枠を確認",
      rate: "制度要件による",
      fit: "中",
    },
    {
      name: "IT導入補助金",
      period: "最新公募を要確認",
      amount: "登録ツール・支援事業者要件を確認",
      rate: "制度要件による",
      fit: "要確認",
    },
    {
      name: "自治体のDX/省力化支援制度",
      period: "自治体公募を要確認",
      amount: "地域・年度で変動",
      rate: "制度要件による",
      fit: "中",
    },
  ];
  return rows[idx] || rows[0];
}

function defaultRisk(idx: number) {
  const rows = [
    {
      name: "入力データ不足",
      impact: "中",
      likelihood: "初期対策で低減",
      mitigation:
        "初月は入力項目を絞り、実データを蓄積してから対象範囲を広げる。",
    },
    {
      name: "AI出力の誤り",
      impact: "高",
      likelihood: "重点管理",
      mitigation:
        "構造化出力検証、禁止表現チェック、未置換プレースホルダー検知で自動送付前に停止する。",
    },
    {
      name: "現場定着不足",
      impact: "中",
      likelihood: "運用で管理",
      mitigation: "担当者の作業画面を変えすぎず、週次で改善点を吸い上げる。",
    },
    {
      name: "費用対効果の不透明化",
      impact: "中",
      likelihood: "月次確認",
      mitigation:
        "削減時間・修正回数・問い合わせ数を月次で記録し、継続判断する。",
    },
  ];
  return rows[idx] || rows[0];
}

function buildCurrentSummary(lead: any) {
  return `現在の主な負荷は「${safeText(lead.daily_tasks) || "日常業務の記録・確認・顧客対応"}」に集中しています。従業員規模は ${safeText(lead.employee_count) || "未入力"} で、まずは属人化しやすい反復業務から小さく自動化するのが現実的です。`;
}

function buildToolSummary(lead: any) {
  return `現在の利用ツール: ${safeText(lead.current_tools) || "未入力"}。既存ツールを置き換えるより、入力・下書き・確認・保存をつなぐ形で導入すると、初期負担を抑えられます。`;
}

function buildExecutiveSummary(proposals: any[]) {
  const monthly = proposals.reduce(
    (sum, p) => sum + Number(p.monthly_value_yen || 0),
    0,
  );
  const hours = proposals.reduce(
    (sum, p) => sum + Number(p.hours_per_month || 0),
    0,
  );
  return `優先度Aの業務から着手することで、月${formatNumber(hours)}時間、月額¥${formatNumber(monthly)}相当の業務負荷削減を見込めます。初期導入費用は1業務MVPで¥270,000〜360,000、2業務まで含める場合は¥420,000〜560,000、実装期間は4〜6週間が目安です。`;
}

function buildConcernAnswer(proposals: any[]) {
  return `最初から大きなシステムを作るのではなく、${proposals[0]?.area || "優先度の高い業務"}を対象に、入力・AI下書き・品質チェック・保存の流れを固定します。外部送信や重要判断だけ確認点を残し、社内処理は自動化することで、費用と現場負担を抑えながら検証できます。`;
}

function padArray(value: any, length: number, fallback: (idx: number) => any) {
  const arr = Array.isArray(value) ? value : [];
  return Array.from({ length }, (_, idx) => arr[idx] || fallback(idx));
}

function safeText(value: unknown) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function textOr(value: unknown, fallback: string) {
  const text = safeText(value);
  return text || fallback;
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, "/");
}

function formatNumber(n: number) {
  return Math.round(Number(n) || 0).toLocaleString("ja-JP");
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
