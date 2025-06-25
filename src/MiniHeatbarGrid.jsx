import React from 'react';
import './MiniHeatbarGrid.css';

// Example data structure for all four services
const EXAMPLE_DATA = [
  { service: 'Cloudflare', status: '🟢 OK', count: 3, trend: [1, 2, 3, 2, 1, 0, 1], trendUp: true },
  { service: 'Okta', status: '🟠 Minor', count: 12, trend: [4, 6, 7, 8, 7, 6, 5], trendUp: false },
  { service: 'SendGrid', status: '🟢 OK', count: 1, trend: [0, 0, 1, 1, 0, 0, 1], trendUp: true },
  { service: 'Zscaler', status: '🔴 Major', count: 43, trend: [20, 30, 35, 40, 43, 42, 41], trendUp: true },
];

// Unicode blocks from low to high: ▁▂▃▄▅▆▇█
const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
function getTrendBar(trend) {
  if (!trend || trend.length === 0) return '';
  const max = Math.max(...trend, 1);
  return trend
    .map(val => BLOCKS[Math.round((val / max) * (BLOCKS.length - 1))])
    .join('');
}

function getTrendArrow(up) {
  return up ? '▲' : '▼';
}

export default function MiniHeatbarGrid({ data = EXAMPLE_DATA }) {
  return (
    <div className="mini-heatbar-grid">
      <div className="mini-heatbar-header" style={{ fontWeight: 700, fontSize: '1.08em' }}>
        <span>User Reported Issues</span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      {data.map((row) => (
        <div className="mini-heatbar-row" key={row.service}>
          <span>{row.service}</span>
          <span>{row.status}</span>
          <span className="mini-heatbar-trend">{getTrendBar(row.trend)}</span>
          <span className="mini-heatbar-reports">{row.count} <span className={row.trendUp ? 'up' : 'down'}>{getTrendArrow(row.trendUp)}</span></span>
        </div>
      ))}
    </div>
  );
}
