import type { APIRoute } from 'astro'

/**
 * 一時的な診断エンドポイント。ADMIN_PASSWORD の検出可否のみ返す（値は返さない）。
 * 動作確認後に削除する。
 */
export const GET: APIRoute = async () => {
  const fromImportMeta = import.meta.env.ADMIN_PASSWORD
  const fromProcessEnv =
    typeof process !== 'undefined' ? process.env?.ADMIN_PASSWORD : undefined

  // process.env のキー一覧（ADMIN で始まるもののみ。値は伏せる）
  const adminKeys =
    typeof process !== 'undefined' && process.env
      ? Object.keys(process.env).filter((k) => k.toUpperCase().includes('ADMIN'))
      : []

  return new Response(
    JSON.stringify(
      {
        import_meta_env_admin_password_present: Boolean(fromImportMeta),
        import_meta_env_admin_password_length: fromImportMeta ? String(fromImportMeta).length : 0,
        process_env_admin_password_present: Boolean(fromProcessEnv),
        process_env_admin_password_length: fromProcessEnv ? String(fromProcessEnv).length : 0,
        process_env_keys_containing_admin: adminKeys,
        node_version: typeof process !== 'undefined' ? process.version : 'no-process',
        runtime: typeof EdgeRuntime !== 'undefined' ? 'edge' : 'node',
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

// EdgeRuntime のグローバル型がないので宣言
declare const EdgeRuntime: unknown
