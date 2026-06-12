import React from 'react'

export default function HelpPanel(){
  return (
    <section className="help-panel full">
      <h2>How this helps you</h2>
      <p>Your feedback is important — submitting a ticket ensures our support and product teams get the information they need to investigate and resolve issues. After you submit:</p>
      <ul>
        <li><strong>Receipt confirmation:</strong> you will receive an email with a ticket ID and confirmation details.</li>
        <li><strong>Rapid triage:</strong> our team reviews tickets and routes them to the appropriate group; emergency issues are prioritized.</li>
        <li><strong>Ongoing updates:</strong> you'll receive status updates by email and can check progress with your ticket ID.</li>
      </ul>
      <h3>Tips for a helpful ticket</h3>
      <ol>
        <li>Summarize the problem in one sentence and state the expected result.</li>
        <li>List the steps to reproduce the issue, including exact screens, fields, or actions.</li>
        <li>Attach a screenshot and note the time/location — if it impacts patient care, mark as <em>High</em> priority.</li>
      </ol>
      <p>If you prefer, you can also email support@evohcg.com; include the ticket ID once created so we can link records.</p>
    </section>
  )
}
