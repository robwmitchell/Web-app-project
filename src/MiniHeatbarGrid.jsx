import React from 'react';
import './MiniHeatbarGrid.css';
import { serviceLogos } from './serviceLogos';

const SERVICES = [
  'Cloudflare',
  'Okta',
  'SendGrid',
  'Zscaler',
  'Slack',
  'Datadog',
  'AWS',
];

const STATUS_MAP = {
  Cloudflare: '🟢 OK',
  Okta: '🟠 Minor',
  SendGrid: '🟢 OK',
  Zscaler: '🔴 Major',
  Slack: '🟢 OK',
  Datadog: '🟠 Minor',
  AWS: '🟢 OK',
};

function getTrendArrow(up) {
  return up ? '▲' : '▼';
}

function ServiceLogo({ service }) {
  const [logoError, setLogoError] = React.useState(false);
  if (logoError || !serviceLogos[service]) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', background: '#f0f0f0', borderRadius: '4px',
        fontSize: '12px', fontWeight: 'bold', color: '#666', minWidth: '28px'
      }}>{service[0]}</div>
    );
  }
  return (
    <img 
      src={serviceLogos[service]} 
      alt={service + ' logo'} 
      style={{ height: 'clamp(20px, 4vw, 28px)', maxWidth: '100%', objectFit: 'contain' }} 
      onError={() => setLogoError(true)}
    />
  );
}

function sanitizeTrend(trend) {
  if (!Array.isArray(trend) || trend.length !== 7) return Array(7).fill(0);
  return trend.map(v => (typeof v === 'number' ? v : 0));
}

function AreaSpark({ data = [], color = '#d32f2f', fill = '#ffd6d6' }) {
  const [dimensions, setDimensions] = React.useState({ width: 200, height: 24 });
  React.useEffect(() => {
    function updateDimensions() {
      const screenWidth = window.innerWidth;
      let width, height;
      if (screenWidth <= 480) {
        width = Math.min(150, screenWidth * 0.35); height = 18;
      } else if (screenWidth <= 600) {
        width = Math.min(180, screenWidth * 0.4); height = 20;
      } else if (screenWidth <= 900) {
        width = Math.min(240, screenWidth * 0.35); height = 22;
      } else {
        width = 280; height = 24;
      }
      setDimensions({ width, height });
    }
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  if (!Array.isArray(data) || data.length === 0) return null;
  const safeData = data.map(v => (typeof v === 'number' ? v : 0));
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const points = safeData.map((v, i) => {
    const x = (i / (safeData.length - 1)) * dimensions.width;
    const y = dimensions.height - ((v - min) / (max - min || 1)) * dimensions.height;
    return [x, y];
  }).filter(([x, y]) => isFinite(x) && isFinite(y));
  if (points.length === 0) return null;
  const areaPoints = [ ...points, [dimensions.width, dimensions.height], [0, dimensions.height] ];
  const areaStr = areaPoints.map(([x, y]) => `${x},${y}`).join(' ');
  const lineStr = points.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg width={dimensions.width} height={dimensions.height} style={{ display: 'block', overflow: 'visible' }}>
        <polygon points={areaStr} fill={fill} opacity="0.85" />
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={lineStr} />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.2" fill={color} />
        ))}
      </svg>
    </div>
  );
}

export default function MiniHeatbarGrid({ selectedServices = SERVICES }) {
  const [trendData, setTrendData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/issue-reports-trend')
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setTrendData(data);
          setLoading(false);
          // Debug: log the fetched data
          console.log('Fetched trend data:', data);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError('Failed to load trend data');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [refreshTrigger, selectedServices]);

  // Listen for issue report events to refresh data
  React.useEffect(() => {
    const handleIssueReported = () => {
      setTimeout(() => setRefreshTrigger(prev => prev + 1), 1000);
    };
    window.addEventListener('issueReported', handleIssueReported);
    return () => window.removeEventListener('issueReported', handleIssueReported);
  }, []);

  if (loading) return <div className="mini-heatbar-grid">Loading...</div>;
  if (error) return <div className="mini-heatbar-grid">{error}</div>;
  if (!trendData || !trendData.trend) return <div className="mini-heatbar-grid">No data</div>;

  const { trend } = trendData;
  // Debug: log the raw trend object
  console.log('Raw trend object:', trend);
  const rows = selectedServices.map(service => {
    // Find the trend key case-insensitively
    const trendKey = Object.keys(trend).find(
      k => k.toLowerCase() === service.toLowerCase()
    );
    const trendArr = sanitizeTrend(trend[trendKey]);
    const todayCount = trendArr[trendArr.length - 1] || 0;
    const trendUp = trendArr.length > 1 ? trendArr[trendArr.length-1] >= trendArr[trendArr.length-2] : false;
    // Debug: log mapping for each service
    console.log('service:', service, 'trendKey:', trendKey, 'trendArr:', trendArr, 'raw:', trend[trendKey]);
    return {
      service,
      status: STATUS_MAP[service],
      count: todayCount,
      trend: trendArr,
      trendUp,
    };
  });
  // Debug: log the final rows array
  console.log('MiniHeatbarGrid rows:', rows);

  return (
    <div className="mini-heatbar-grid">
      <div className="mini-heatbar-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>User Reported Issues</span>
        <button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          disabled={loading}
          style={{
            background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px', color: '#666', padding: '2px 6px', borderRadius: '4px',
            transition: 'all 0.2s', opacity: loading ? 0.5 : 1
          }}
          onMouseEnter={e => !loading && (e.target.style.backgroundColor = '#f0f0f0')}
          onMouseLeave={e => (e.target.style.backgroundColor = 'transparent')}
          title="Refresh data"
          aria-label="Refresh issue reports data"
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>
      <div className="mini-heatbar-header" style={{ fontWeight: 700, fontSize: '1.08em' }}>
        <span>Service</span>
        <span>Trend (7 days)</span>
        <span>Today</span>
      </div>
      {rows.map(row => (
        <div className="mini-heatbar-row" key={row.service}>
          <span style={{ minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <ServiceLogo service={row.service} />
          </span>
          <span className="mini-heatbar-trend">
            <AreaSpark data={row.trend} color="#d32f2f" fill="#ffd6d6" />
          </span>
          <span className="mini-heatbar-reports">{row.count} <span className={row.trendUp ? 'up' : 'down'}>{getTrendArrow(row.trendUp)}</span></span>
        </div>
      ))}
    </div>
  );
}
