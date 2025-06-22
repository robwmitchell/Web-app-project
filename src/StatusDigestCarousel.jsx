import React, { useState } from 'react';
import './LivePulseCard.css';
import { getServiceLogo } from './serviceLogos';

const SENTIMENT_COLORS = {
  resolved: '#4caf50',
  monitoring: '#ff9800',
  identified: '#f44336',
  investigating: '#b71c1c',
  scheduled: '#1976d2',
  default: '#757575',
};

function getSentimentTag(text) {
  const t = text.toLowerCase();
  if (t.includes('resolved') || t.includes('completed')) return { label: 'Resolved', color: SENTIMENT_COLORS.resolved };
  if (t.includes('monitoring')) return { label: 'Monitoring', color: SENTIMENT_COLORS.monitoring };
  if (t.includes('identified')) return { label: 'Identified', color: SENTIMENT_COLORS.identified };
  if (t.includes('investigating')) return { label: 'Investigating', color: SENTIMENT_COLORS.investigating };
  if (t.includes('scheduled')) return { label: 'Scheduled', color: SENTIMENT_COLORS.scheduled };
  return { label: 'Update', color: SENTIMENT_COLORS.default };
}

export default function StatusDigestCarousel({ digests }) {
  const [idx, setIdx] = useState(0);
  if (!digests || digests.length === 0) return null;
  const digest = digests[idx];
  const sentiment = getSentimentTag(digest.sentiment || digest.summary || '');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f7f7fa', borderRadius: 10, padding: '18px 24px', marginBottom: 24, minHeight: 60,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      maxWidth: 700, marginLeft: 'auto', marginRight: 'auto',
    }}>
      <button onClick={() => setIdx((idx - 1 + digests.length) % digests.length)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', marginRight: 16 }}>&lt;</button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {getServiceLogo(digest.provider)}
        <span style={{ fontWeight: 600 }}>{digest.provider}:</span> {digest.summary}
        <span style={{
          display: 'inline-block',
          marginLeft: 12,
          padding: '2px 10px',
          borderRadius: 8,
          background: sentiment.color,
          color: '#fff',
          fontSize: '0.95em',
          fontWeight: 500,
        }}>{sentiment.label}</span>
      </div>
      <button onClick={() => setIdx((idx + 1) % digests.length)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', marginLeft: 16 }}>&gt;</button>
    </div>
  );
}
