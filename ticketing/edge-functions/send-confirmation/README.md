Edge Function: send-confirmation

This Edge Function is a template that sends a confirmation email when a ticket is created.

Configure an HTTP-triggered Edge Function in your local Supabase functions directory and set the environment variable SENDGRID_API_KEY (or adjust to your SMTP provider API).

Usage:
- Deploy the function to your local Supabase functions host or test via `supabase functions serve`.
- Either call the function from the client after inserting a ticket, or set up a DB trigger to call the function on insert.
