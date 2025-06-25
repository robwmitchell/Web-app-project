import React from 'react';
import './MiniHeatbarGrid.css';

// Example data structure for all four services
const EXAMPLE_DATA = [
  { service: 'Cloudflare', status: '🟢 OK', count: 3 },
  { service: 'Okta', status: '🟠 Minor', count: 12 },
  { service: 'SendGrid', status: '🟢 OK', count: 1 },
  { service: 'Zscaler', status: '🔴 Major', count: 43 },
];

function getBar(count, max = 120) {
  const barLength = Math.round((count / max) * 12); // 12 blocks max
  return '■'.repeat(barLength).padEnd(12, ' ');
}

export default function MiniHeatbarGrid({ data = EXAMPLE_DATA }) {
  return (
    <div className="mini-heatbar-grid">
      <div className="mini-heatbar-header">
        <span>Service</span>
        <span>Status</span>
        <span>User Reported Issues Today</span>
      </div>
      {data.map((row, idx) => (
        <div className="mini-heatbar-row" key={row.service}>
          <span>{row.service}</span>
          <span>{row.status}</span>
          <span className="mini-heatbar-bar">[{getBar(row.count)}] {row.count}</span>
        </div>
      ))}
    </div>
  );
}
