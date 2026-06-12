// Supabase Edge Function (Deno) - generate-signed-url
// Expects JSON body: { path, expires } and optional bucket in env VITE_STORAGE_BUCKET
// Requires env var: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.json()
    const { path, expires = 60 } = body
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const bucket = Deno.env.get('STORAGE_BUCKET') || 'tickets'
    if(!SUPABASE_URL || !SERVICE_ROLE) return new Response('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY', { status: 500 })

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires)
    if(error) return new Response('Error: '+error.message, { status: 502 })
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('Error: '+String(err), { status: 500 })
  }
})
