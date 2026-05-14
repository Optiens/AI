-- ============================================================
-- AI/API observability for diagnosis automation
-- ============================================================
--
-- Stores API-call metadata only. Prompts, generated report text, API keys,
-- and customer-sensitive raw payloads must not be written here.

CREATE TABLE IF NOT EXISTS public.ai_api_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  workflow TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  operation TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'retry', 'skipped')),
  http_status INTEGER,
  latency_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  context_window_tokens INTEGER,
  context_remaining_tokens INTEGER,
  request_id TEXT,
  lead_id TEXT,
  application_id TEXT,
  error_type TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_api_events_created_at
  ON public.ai_api_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_api_events_provider_created
  ON public.ai_api_events(provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_api_events_status_created
  ON public.ai_api_events(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_api_events_lead_id
  ON public.ai_api_events(lead_id)
  WHERE lead_id IS NOT NULL;

COMMENT ON TABLE public.ai_api_events IS
  'AI/API通信の運用監視ログ。プロンプト本文・生成本文・APIキーは保存しない。';
COMMENT ON COLUMN public.ai_api_events.context_window_tokens IS
  '環境変数 OPENAI_CONTEXT_WINDOW_TOKENS 等で設定した推定コンテキスト上限。未設定時はNULL。';
COMMENT ON COLUMN public.ai_api_events.context_remaining_tokens IS
  'total_tokens と context_window_tokens から算出した推定残りコンテキスト。未設定時はNULL。';
COMMENT ON COLUMN public.ai_api_events.error_message IS
  '通信・生成エラーの要約。長文や顧客入力本文は保存しない。';

ALTER TABLE public.ai_api_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.ai_api_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_api_events TO service_role;

REVOKE ALL PRIVILEGES ON SEQUENCE public.ai_api_events_id_seq FROM anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.ai_api_events_id_seq TO service_role;
