import React from 'react';

export default function ReportImpactForm({ serviceName, onClose }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [impactedProvider] = React.useState(serviceName || '');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: impactedProvider,
          impacted_provider: impactedProvider,
          description,
          user_email: email || undefined,
          status: 'open',
          metadata: name ? { name } : undefined
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }
      setSuccess(true);
      setName('');
      setEmail('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div style={{ color: '#388e3c', padding: 12, textAlign: 'center' }}>
      Thank you for reporting your issue!
      <br />
      <button onClick={onClose} style={{ marginTop: 16, background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>Close</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="hidden" name="service_name" value={impactedProvider} />
      <input type="text" name="impacted_provider" value={impactedProvider} readOnly style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#f5f5f5', color: '#888' }} />
      <input type="text" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
      <input type="email" placeholder="Your email (optional)" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
      <textarea placeholder="Describe your issue..." required value={description} onChange={e => setDescription(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 60 }} />
      {error && <div style={{ color: '#b71c1c', fontSize: '0.98em' }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ background: '#b71c1c', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Submitting...' : 'Submit'}</button>
      <button type="button" onClick={onClose} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>Cancel</button>
    </form>
  );
}
