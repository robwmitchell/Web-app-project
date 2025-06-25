import React from 'react';
import './MiniHeatbarGrid.css';

const SERVICES = [
  'Cloudflare',
  'Okta',
  'SendGrid',
  'Zscaler',
];

const STATUS_MAP = {
  Cloudflare: '🟢 OK',
  Okta: '🟠 Minor',
  SendGrid: '🟢 OK',
  Zscaler: '🔴 Major',
};

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

export default function MiniHeatbarGrid() {
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    async function fetchData() {
      const [todayRes, trendRes] = await Promise.all([
        fetch('/api/issue-reports-today').then(r => r.json()),
        fetch('/api/issue-reports-trend').then(r => r.json()),
      ]);
      // todayRes.data: [{ service_name, count }]
      // trendRes.trend: { service_name: [counts...] }
      const todayMap = {};
      (todayRes.data || []).forEach(row => {
        todayMap[row.service_name] = Number(row.count);
      });
      const trendMap = trendRes.trend || {};
      const rows = SERVICES.map(service => {
        const trend = trendMap[service] || [0,0,0,0,0,0,0];
        const count = todayMap[service] || 0;
        const trendUp = trend.length > 1 ? trend[trend.length-1] >= trend[trend.length-2] : false;
        return {
          service,
          status: STATUS_MAP[service],
          count,
          trend,
          trendUp,
        };
      });
      setData(rows);
    }
    fetchData();
  }, []);

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
