import React from 'react';
import './MiniHeatbarGrid.css';
import { serviceLogos } from './serviceLogos';

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

function AreaSpark({ data = [], color = '#d32f2f', fill = '#ffd6d6' }) {
  const [dimensions, setDimensions] = React.useState({ width: 200, height: 24 });
  
  React.useEffect(() => {
    function updateDimensions() {
      const screenWidth = window.innerWidth;
      let width, height;
      
      if (screenWidth <= 480) {
        width = Math.min(150, screenWidth * 0.35);
        height = 18;
      } else if (screenWidth <= 600) {
        width = Math.min(180, screenWidth * 0.4);
        height = 20;
      } else if (screenWidth <= 900) {
        width = Math.min(240, screenWidth * 0.35);
        height = 22;
      } else {
        width = 280;
        height = 24;
      }
      
      setDimensions({ width, height });
    }
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Accepts array of numbers (7-day trend data)
  if (!Array.isArray(data) || data.length === 0) return null;
  const safeData = data.map(v => (typeof v === 'number' ? v : 0));
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  
  // Points for the line
  const points = safeData.map((v, i) => {
    const x = (i / (safeData.length - 1)) * dimensions.width;
    const y = dimensions.height - ((v - min) / (max - min || 1)) * dimensions.height;
    return [x, y];
  }).filter(([x, y]) => isFinite(x) && isFinite(y));
  
  if (points.length === 0) return null;
  
  // Area polygon: line points + bottom right + bottom left
  const areaPoints = [
    ...points,
    [dimensions.width, dimensions.height],
    [0, dimensions.height],
  ];
  const areaStr = areaPoints.map(([x, y]) => `${x},${y}`).join(' ');
  const lineStr = points.map(([x, y]) => `${x},${y}`).join(' ');
  
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        style={{ display: 'block', overflow: 'visible' }}
      >
        <polygon points={areaStr} fill={fill} opacity="0.85" />
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={lineStr} />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.2" fill={color} />
        ))}
      </svg>
    </div>
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
      <div className="mini-heatbar-title">User Reported Issues</div>
      <div className="mini-heatbar-header" style={{ fontWeight: 700, fontSize: '1.08em' }}>
        <span>Service</span>
        <span>Trend (7 days)</span>
        <span>Today</span>
      </div>
      {data.map((row) => (
        <div className="mini-heatbar-row" key={row.service}>
          <span style={{ minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <img 
              src={serviceLogos[row.service]} 
              alt={row.service + ' logo'} 
              style={{ height: 'clamp(20px, 4vw, 28px)', maxWidth: '100%' }} 
            />
            {/* Service name hidden for minimalist look */}
          </span>
          <span className="mini-heatbar-trend">
            <AreaSpark 
              data={row.trend} 
              color="#d32f2f" 
              fill="#ffd6d6" 
            />
          </span>
          <span className="mini-heatbar-reports">{row.count} <span className={row.trendUp ? 'up' : 'down'}>{getTrendArrow(row.trendUp)}</span></span>
        </div>
      ))}
    </div>
  );
}
