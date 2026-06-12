// Supabase Edge Function — send-status-update
// Body: { email, name, ticketId, status, resolutionNotes? }

import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'

serve(async (req) => {
  try {
    const body = await req.json()
    const { email, name, ticketId, status, resolutionNotes } = body
    const apiKey = Deno.env.get('SENDGRID_API_KEY')
    const sender = Deno.env.get('SENDER_EMAIL')
    if (!apiKey || !sender) {
      return new Response('Missing SENDGRID_API_KEY or SENDER_EMAIL', { status: 500 })
    }

    let text = `Hi ${name},\n\nYour ticket (${ticketId}) status has been updated to: ${status}.\n`
    if (resolutionNotes) {
      text += `\nResolution notes:\n${resolutionNotes}\n`
    }
    text += `\nYou can check progress anytime with your ticket ID and email.\n\nBest,\nEvo Support`

    const msg = {
      personalizations: [{ to: [{ email }], subject: `Evo ticket update — ${status}` }],
      from: { email: sender, name: 'Evo Support' },
      content: [{ type: 'text/plain', value: text }],
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(msg),
    })

    if (!res.ok) {
      return new Response('SendGrid error: ' + (await res.text()), { status: 502 })
    }

    return new Response(JSON.stringify({ status: 'sent' }), { status: 200 })
  } catch (err) {
    return new Response('Error: ' + String(err), { status: 500 })
  }
})
