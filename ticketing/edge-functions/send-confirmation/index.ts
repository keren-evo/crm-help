// Supabase Edge Function (Deno) - send-confirmation
// Expects JSON body: { email, name, ticketId }
// Requires env var: SENDGRID_API_KEY and SENDER_EMAIL

import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'

serve(async (req) => {
  try {
    const body = await req.json()
    const { email, name, ticketId } = body
    const apiKey = Deno.env.get('SENDGRID_API_KEY')
    const sender = Deno.env.get('SENDER_EMAIL')
    if(!apiKey || !sender) return new Response('Missing SENDGRID_API_KEY or SENDER_EMAIL', { status: 500 })

    const msg = {
      personalizations: [{ to: [{ email }], subject: `Evo ticket received — ${ticketId}` }],
      from: { email: sender, name: 'Evo Support' },
      content: [{ type: 'text/plain', value: `Hi ${name},\n\nThanks — we've received your ticket (${ticketId}). We'll update you as it progresses.\n\nBest,\nEvo Support` }]
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(msg)
    })

    if(!res.ok) {
      const t = await res.text()
      return new Response('SendGrid error: '+t, { status: 502 })
    }

    return new Response(JSON.stringify({ status: 'sent' }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('Error: '+String(err), { status: 500 })
  }
})
