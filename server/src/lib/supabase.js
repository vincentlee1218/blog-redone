import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

// Null until you fill in .env, so the server still starts without credentials.
// `ws` is only needed on Node < 22 (no native WebSocket); safe to remove after upgrading.
export const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
        realtime: { transport: ws },
      })
    : null

// Counts rows in `posts` to confirm the URL, key and table all work.
export async function checkDb() {
  if (!supabase) {
    return { ok: false, status: 503, error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set' }
  }

  const started = Date.now()
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })

  if (error) {
    return { ok: false, status: 500, supabaseUrl: SUPABASE_URL, error: error.message, code: error.code, hint: error.hint }
  }
  return {
    ok: true,
    status: 200,
    message: 'Connected to Supabase',
    supabaseUrl: SUPABASE_URL,
    table: 'posts',
    postCount: count,
    latencyMs: Date.now() - started,
  }
}
