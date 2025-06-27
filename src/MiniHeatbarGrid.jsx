import React from 'react';
import './MiniHeatbarGrid.css';
import { serviceLogos        } };
        trendRes = { trend: {
          Cloudflare: Array(7).fill(0),
          Okta: Array(7).fill(0),
          SendGrid: Array(7).fill(0),
          Zscaler: Array(7).fill(0),
        } }; './serviceLogos';

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

function getTrendArrow(up) {
  return up ? '▲' : '▼';
}

function sanitizeTrend(trend) {
  // Ensure trend is an array of 7 numbers for the last 7 days
  if (!Array.isArray(trend) || trend.length !== 7) return Array(7).fill(0);
  return trend.map(v => {
    if (typeof v === 'number') return v;
    return 0;
  });
}

function AreaSpark({ data = [], width = 384, height = 28, color = '#d32f2f', fill = '#ffd6d6' }) {
  // Accepts array of numbers (7-day trend data)
  if (!Array.isArray(data) || data.length === 0) return null;
  const safeData = data.map(v => (typeof v === 'number' ? v : 0));
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  // Points for the line
  const points = safeData.map((v, i) => {
    const x = (i / (safeData.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return [x, y];
  }).filter(([x, y]) => isFinite(x) && isFinite(y));
  if (points.length === 0) return null;
  // Area polygon: line points + bottom right + bottom left
  const areaPoints = [
    ...points,
    [width, height],
    [0, height],
  ];
  const areaStr = areaPoints.map(([x, y]) => `${x},${y}`).join(' ');
  const lineStr = points.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polygon points={areaStr} fill={fill} opacity="0.85" />
      <polyline fill="none" stroke={color} strokeWidth="2" points={lineStr} />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill={color} />
      ))}
    </svg>
  );
}

export default function MiniHeatbarGrid() {
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    async function fetchData() {
      let todayRes, trendRes;
      let isLocal = false;
      try {
        isLocal = ["localhost", "127.0.0.1"].some(h => window.location.hostname.includes(h));
      } catch {}
      if (isLocal) {
        // Dummy data for local development
        todayRes = { data: [
          { service_name: 'Cloudflare', count: 2 },
          { service_name: 'Okta', count: 0 },
          { service_name: 'SendGrid', count: 1 },
          { service_name: 'Zscaler', count: 3 },
        ] };
        trendRes = { trend: {
          Cloudflare: Array(24).fill({ count: 0, timestamps: [] }),
          Okta: Array(24).fill({ count: 0, timestamps: [] }),
          SendGrid: Array(24).fill({ count: 0, timestamps: [] }),
          Zscaler: Array(24).fill({ count: 0, timestamps: [] }),
        } };
      } else {
        [todayRes, trendRes] = await Promise.all([
          fetch('/api/issue-reports-today').then(r => r.json()),
          fetch('/api/issue-reports-trend').then(r => r.json()),
        ]);
      }
      const todayMap = {};
      (todayRes.data || []).forEach(row => {
        todayMap[row.service_name] = Number(row.count);
      });
      const trendMap = trendRes.trend || {};
      const rows = SERVICES.map(service => {
        const trend = sanitizeTrend(trendMap[service]);
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
        <span>User Reported Issues (last 24h)</span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      {data.map((row) => (
        <div className="mini-heatbar-row" key={row.service}>
          <span style={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <img src={serviceLogos[row.service]} alt={row.service + ' logo'} style={{ height: 28 }} />
            {/* Service name hidden for minimalist look */}
          </span>
          <span className="mini-heatbar-trend">
            <AreaSpark data={row.trend} width={384} height={28} color="#d32f2f" fill="#ffd6d6" />
          </span>
          <span className="mini-heatbar-reports">{row.count} <span className={row.trendUp ? 'up' : 'down'}>{getTrendArrow(row.trendUp)}</span></span>
        </div>
      ))}
    </div>
  );
}
