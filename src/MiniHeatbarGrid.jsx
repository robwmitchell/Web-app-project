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

function getTrendArrow(up) {
  return up ? '▲' : '▼';
}

function AreaSpark({ data = [], width = 384, height = 28, color = '#d32f2f', fill = '#ffd6d6' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  // Points for the line
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return [x, y];
  });
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
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / (max - min || 1)) * height;
        return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
      })}
    </svg>
  );
}

function TimelineAxis({ points = 24, width = 384, height = 16, issueHours = [] }) {
  // Show 24h axis: 0, 4, 8, 12, 16, 20, 24
  const labels = [0, 4, 8, 12, 16, 20, 24];
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <line x1={0} y1={height-1} x2={width} y2={height-1} stroke="#bbb" strokeWidth="1" />
      {labels.map(hr => {
        const x = (hr / 24) * width;
        return (
          <g key={hr}>
            <line x1={x} y1={height-6} x2={x} y2={height} stroke="#bbb" strokeWidth="1" />
            <text x={x} y={height+10} textAnchor="middle" fontSize="9" fill="#888">{hr === 0 ? '12AM' : hr === 12 ? '12PM' : hr}</text>
          </g>
        );
      })}
      {/* Issue indicators */}
      {issueHours.map((h, idx) => {
        const x = (h / 24) * width;
        return <circle key={idx} cx={x} cy={height-8} r="4" fill="#d32f2f" stroke="#fff" strokeWidth="1.5" />;
      })}
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
          Cloudflare: [0,1,0,2,1,0,2,1,0,0,1,2,1,0,0,1,2,1,0,0,1,2,1,0],
          Okta: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          SendGrid: [0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],
          Zscaler: [1,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1],
        } };
      } else {
        [todayRes, trendRes] = await Promise.all([
          fetch('/api/issue-reports-today').then(r => r.json()),
          fetch('/api/issue-reports-trend').then(r => r.json()),
        ]);
      }
      // todayRes.data: [{ service_name, count }]
      // trendRes.trend: { service_name: [counts...] }
      const todayMap = {};
      (todayRes.data || []).forEach(row => {
        todayMap[row.service_name] = Number(row.count);
      });
      const trendMap = trendRes.trend || {};
      const rows = SERVICES.map(service => {
        // If you have 24-hour data, use it; else fallback to 7-day
        const trend = trendMap[service] && trendMap[service].length === 24
          ? trendMap[service]
          : trendMap[service] || [0,0,0,0,0,0,0];
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
      {data.map((row) => {
        // Find hours with issues (trend > 0)
        const issueHours = (row.trend || []).map((v, i) => v > 0 ? i : null).filter(i => i !== null);
        return (
          <div className="mini-heatbar-row" key={row.service} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <span style={{ minWidth: 80 }}>{row.service}</span>
              <span style={{ minWidth: 70 }}>{row.status}</span>
              <span className="mini-heatbar-trend">
                <AreaSpark data={row.trend} width={384} height={28} color="#d32f2f" fill="#ffd6d6" />
              </span>
              <span className="mini-heatbar-reports">{row.count} <span className={row.trendUp ? 'up' : 'down'}>{getTrendArrow(row.trendUp)}</span></span>
            </div>
            <div style={{ width: 384, marginLeft: 150, marginTop: 0 }}>
              <TimelineAxis width={384} issueHours={issueHours} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
