import React from 'react';
import Button from './Button';

export default function ReportImpactForm({ serviceName, onClose }) {
  // List of allowed services
  const ALLOWED_SERVICES = [
    'Cloudflare',
    'Okta',
    'SendGrid',
    'Zscaler',
  ];
  const [selectedService, setSelectedService] = React.useState(
    ALLOWED_SERVICES.includes(serviceName) ? serviceName : ALLOWED_SERVICES[0]
  );
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [description, setDescription] = React.useState('');
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
          service_name: selectedService,
          impacted_provider: selectedService,
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
      <Button onClick={onClose} style={{ marginTop: 16, background: '#eee', color: '#333' }}>Close</Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label htmlFor="service_name">Service</label>
      <select
        id="service_name"
        name="service_name"
        value={selectedService}
        onChange={e => setSelectedService(e.target.value)}
        style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#fff' }}
        required
      >
        {ALLOWED_SERVICES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input type="hidden" name="impacted_provider" value={selectedService} />
      <input type="text" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
      <input type="email" placeholder="Your email (optional)" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
      <textarea placeholder="Describe your issue..." required value={description} onChange={e => setDescription(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 60 }} />
      {error && <div style={{ color: '#b71c1c', fontSize: '0.98em' }}>{error}</div>}
      <Button type="submit" disabled={loading} style={{ background: '#b71c1c' }}>{loading ? 'Submitting...' : 'Submit'}</Button>
      <Button type="button" onClick={onClose} style={{ background: '#eee', color: '#333' }}>Cancel</Button>
    </form>
  );
}
