// Supabase Edge Function — check-escalation
// Finds High-priority tickets with no movement for 48+ hours and sends alerts.
// Schedule via Supabase cron: 0 */6 * * * (every 6 hours)

import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const apiKey = Deno.env.get('SENDGRID_API_KEY')
    const sender = Deno.env.get('SENDER_EMAIL')
    const triageEmail = Deno.env.get('TRIAGE_ALERT_EMAIL') || sender

    if (!supabaseUrl || !serviceKey) {
      return new Response('Missing Supabase service credentials', { status: 500 })
    }
    if (!apiKey || !sender) {
      return new Response('Missing SendGrid credentials', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, category, email, name, priority, status, last_movement_at')
      .eq('priority', 'High')
      .eq('escalation_alert_sent', false)
      .not('status', 'in', '("Resolved","Closed","Duplicate","Not in Scope")')
      .lt('last_movement_at', cutoff)

    if (error) throw error

    let alerted = 0
    for (const t of tickets || []) {
      const { data: cat } = await supabase
        .from('ticket_categories')
        .select('notification_emails')
        .eq('name', t.category)
        .maybeSingle()

      const recipients = new Set([triageEmail])
        ; (cat?.notification_emails || []).forEach((e) => recipients.add(e))

      const body = `High-priority ticket stalled 48+ hours\n\nID: ${t.id}\nTitle: ${t.title || '—'}\nCategory: ${t.category}\nStatus: ${t.status}\nSubmitter: ${t.name} <${t.email}>\nLast movement: ${t.last_movement_at}\n\nPlease triage and assign immediately.`

      for (const to of recipients) {
        if (!to) continue
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }], subject: `[ESCALATION] High ticket stalled — ${t.id}` }],
            from: { email: sender, name: 'Evo Ticketing' },
            content: [{ type: 'text/plain', value: body }],
          }),
        })
      }

      await supabase.from('tickets').update({ escalation_alert_sent: true }).eq('id', t.id)
      alerted += 1
    }

    return new Response(JSON.stringify({ alerted, checked: tickets?.length || 0 }), { status: 200 })
  } catch (err) {
    return new Response('Error: ' + String(err), { status: 500 })
  }
})
