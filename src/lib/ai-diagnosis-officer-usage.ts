type UnknownRecord = Record<string, unknown>

export type AiDiagnosisOfficerUsageBreakdown = {
  input_tokens: number
  output_tokens: number
  total_tokens: number
  text_input_tokens: number
  text_output_tokens: number
  audio_input_tokens: number
  audio_output_tokens: number
  cached_input_tokens: number
  cached_text_input_tokens: number
  cached_audio_input_tokens: number
}

export type AiDiagnosisOfficerCostEstimate = {
  estimated_cost_usd: number
  estimated_cost_jpy: number | null
}

const DEFAULT_USD_JPY_RATE = 155

type RealtimeRateCard = {
  textInput: number
  textCachedInput: number
  textOutput: number
  audioInput: number
  audioCachedInput: number
  audioOutput: number
}

const REALTIME_RATE_CARDS: Record<string, RealtimeRateCard> = {
  'gpt-realtime': {
    textInput: 4,
    textCachedInput: 0.4,
    textOutput: 16,
    audioInput: 32,
    audioCachedInput: 0.4,
    audioOutput: 64,
  },
  'gpt-realtime-1.5': {
    textInput: 4,
    textCachedInput: 0.4,
    textOutput: 16,
    audioInput: 32,
    audioCachedInput: 0.4,
    audioOutput: 64,
  },
  'gpt-realtime-2': {
    textInput: 4,
    textCachedInput: 0.4,
    textOutput: 24,
    audioInput: 32,
    audioCachedInput: 0.4,
    audioOutput: 64,
  },
  'gpt-realtime-mini': {
    textInput: 0.6,
    textCachedInput: 0.06,
    textOutput: 2.4,
    audioInput: 10,
    audioCachedInput: 0.3,
    audioOutput: 20,
  },
}

const TEXT_RATE_CARDS: Record<string, { input: number; cachedInput: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, cachedInput: 0.075, output: 0.6 },
  'gpt-4.1-mini': { input: 0.4, cachedInput: 0.1, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, cachedInput: 0.025, output: 0.4 },
  'gpt-5.4-mini': { input: 0.375, cachedInput: 0.0375, output: 2.25 },
  'gpt-5.4-nano': { input: 0.1, cachedInput: 0.01, output: 0.625 },
}

function numberFrom(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

function envNumber(name: string, fallback: number) {
  const parsed = Number(process.env[name] || '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {}
}

function normalizeModelName(model: string) {
  return model.trim().toLowerCase()
}

function realtimeRateCardFor(model: string): RealtimeRateCard {
  const normalized = normalizeModelName(model)
  const key = Object.keys(REALTIME_RATE_CARDS)
    .sort((a, b) => b.length - a.length)
    .find((name) => normalized === name || normalized.startsWith(`${name}-`))
  const fallback = REALTIME_RATE_CARDS['gpt-realtime']
  const selected = key ? REALTIME_RATE_CARDS[key] : fallback
  return {
    textInput: envNumber('OPENAI_REALTIME_TEXT_INPUT_USD_PER_1M', selected.textInput),
    textCachedInput: envNumber('OPENAI_REALTIME_TEXT_CACHED_INPUT_USD_PER_1M', selected.textCachedInput),
    textOutput: envNumber('OPENAI_REALTIME_TEXT_OUTPUT_USD_PER_1M', selected.textOutput),
    audioInput: envNumber('OPENAI_REALTIME_AUDIO_INPUT_USD_PER_1M', selected.audioInput),
    audioCachedInput: envNumber('OPENAI_REALTIME_AUDIO_CACHED_INPUT_USD_PER_1M', selected.audioCachedInput),
    audioOutput: envNumber('OPENAI_REALTIME_AUDIO_OUTPUT_USD_PER_1M', selected.audioOutput),
  }
}

function textRateCardFor(model: string) {
  const normalized = normalizeModelName(model)
  const key = Object.keys(TEXT_RATE_CARDS)
    .sort((a, b) => b.length - a.length)
    .find((name) => normalized === name || normalized.startsWith(`${name}-`))
  const selected = key ? TEXT_RATE_CARDS[key] : TEXT_RATE_CARDS['gpt-4o-mini']
  return {
    input: envNumber('AI_DIAGNOSIS_OFFICER_TEXT_INPUT_USD_PER_1M', envNumber('OPENAI_INPUT_USD_PER_1M', selected.input)),
    cachedInput: envNumber('AI_DIAGNOSIS_OFFICER_TEXT_CACHED_INPUT_USD_PER_1M', envNumber('OPENAI_CACHED_INPUT_USD_PER_1M', selected.cachedInput)),
    output: envNumber('AI_DIAGNOSIS_OFFICER_TEXT_OUTPUT_USD_PER_1M', envNumber('OPENAI_OUTPUT_USD_PER_1M', selected.output)),
  }
}

export function normalizeRealtimeUsage(usage: unknown): AiDiagnosisOfficerUsageBreakdown {
  const root = getRecord(usage)
  const inputDetails = getRecord(root.input_token_details || root.input_tokens_details)
  const outputDetails = getRecord(root.output_token_details || root.output_tokens_details)

  const textInput = numberFrom(inputDetails.text_tokens || inputDetails.text)
  const audioInput = numberFrom(inputDetails.audio_tokens || inputDetails.audio)
  const textOutput = numberFrom(outputDetails.text_tokens || outputDetails.text)
  const audioOutput = numberFrom(outputDetails.audio_tokens || outputDetails.audio)
  const cachedDetails = getRecord(inputDetails.cached_tokens_details)
  const cachedText = numberFrom(cachedDetails.text_tokens || cachedDetails.text)
  const cachedAudio = numberFrom(cachedDetails.audio_tokens || cachedDetails.audio)
  const cachedInput = numberFrom(inputDetails.cached_tokens) || cachedText + cachedAudio
  const inputTokens = numberFrom(root.input_tokens)
  const outputTokens = numberFrom(root.output_tokens)
  const totalTokens = numberFrom(root.total_tokens)

  return {
    input_tokens: inputTokens || textInput + audioInput + cachedInput,
    output_tokens: outputTokens || textOutput + audioOutput,
    total_tokens: totalTokens || inputTokens + outputTokens || textInput + audioInput + textOutput + audioOutput + cachedInput,
    text_input_tokens: textInput,
    text_output_tokens: textOutput,
    audio_input_tokens: audioInput,
    audio_output_tokens: audioOutput,
    cached_input_tokens: cachedInput,
    cached_text_input_tokens: cachedText || Math.min(cachedInput, textInput),
    cached_audio_input_tokens: cachedAudio || Math.min(Math.max(cachedInput - textInput, 0), audioInput),
  }
}

export function normalizeChatUsage(usage: unknown): AiDiagnosisOfficerUsageBreakdown {
  const root = getRecord(usage)
  const inputTokens = numberFrom(root.prompt_tokens || root.input_tokens)
  const outputTokens = numberFrom(root.completion_tokens || root.output_tokens)
  const totalTokens = numberFrom(root.total_tokens) || inputTokens + outputTokens

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    text_input_tokens: inputTokens,
    text_output_tokens: outputTokens,
    audio_input_tokens: 0,
    audio_output_tokens: 0,
    cached_input_tokens: 0,
    cached_text_input_tokens: 0,
    cached_audio_input_tokens: 0,
  }
}

export function estimateRealtimeCost(
  usage: AiDiagnosisOfficerUsageBreakdown,
  model = 'gpt-realtime',
): AiDiagnosisOfficerCostEstimate {
  const rate = realtimeRateCardFor(model)
  const uncachedTextInput = Math.max(0, usage.text_input_tokens - usage.cached_text_input_tokens)
  const uncachedAudioInput = Math.max(0, usage.audio_input_tokens - usage.cached_audio_input_tokens)
  const usd =
    (uncachedTextInput / 1_000_000) * rate.textInput +
    (usage.cached_text_input_tokens / 1_000_000) * rate.textCachedInput +
    (usage.text_output_tokens / 1_000_000) * rate.textOutput +
    (uncachedAudioInput / 1_000_000) * rate.audioInput +
    (usage.cached_audio_input_tokens / 1_000_000) * rate.audioCachedInput +
    (usage.audio_output_tokens / 1_000_000) * rate.audioOutput

  return withJpy(usd)
}

export function estimateTextCost(
  usage: AiDiagnosisOfficerUsageBreakdown,
  model = 'gpt-4o-mini',
): AiDiagnosisOfficerCostEstimate {
  const rate = textRateCardFor(model)
  const uncachedTextInput = Math.max(0, usage.text_input_tokens - usage.cached_text_input_tokens)
  const usd =
    (uncachedTextInput / 1_000_000) * rate.input +
    (usage.cached_text_input_tokens / 1_000_000) * rate.cachedInput +
    (usage.text_output_tokens / 1_000_000) * rate.output

  return withJpy(usd)
}

function withJpy(usd: number): AiDiagnosisOfficerCostEstimate {
  const normalizedUsd = Number(usd.toFixed(6))
  const usdJpy = envNumber('USD_JPY_RATE', DEFAULT_USD_JPY_RATE)
  return {
    estimated_cost_usd: normalizedUsd,
    estimated_cost_jpy: Math.max(0, Math.round(normalizedUsd * usdJpy)),
  }
}

export function safeSessionId(value: unknown) {
  const text = String(value || '').trim()
  return /^[a-zA-Z0-9_-]{12,80}$/.test(text) ? text : ''
}

export function safeTicketNumber(value: unknown) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 80)
}
