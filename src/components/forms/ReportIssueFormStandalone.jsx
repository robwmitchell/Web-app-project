import React from "react";

export default function ReportIssueFormStandalone() {
  // You can import and reuse your existing form component here if it exists
  // For now, a simple placeholder form is provided
  return (
    <div style={{ padding: 24, background: '#fff', minWidth: 320 }}>
      <h2 style={{ marginTop: 0 }}>Report an Issue</h2>
      <form method="POST" action="/api/report-issue">
        <input type="hidden" name="service" value={
          new URLSearchParams(window.location.search).get('service') || ''
        } />
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="description">Description:</label><br />
          <textarea id="description" name="description" rows={4} style={{ width: '100%' }} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">Your Email (optional):</label><br />
          <input id="email" name="email" type="email" style={{ width: '100%' }} />
        </div>
        <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 500 }}>
          Submit
        </button>
      </form>
    </div>
  );
}
