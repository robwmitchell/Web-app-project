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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        background: '#f0f0f0',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#666',
        minWidth: '28px'
      }}>
        {service[0]}
      </div>
    );
  }
  
  return (
    <img 
      src={serviceLogos[service]} 
      alt={service + ' logo'} 
      style={{ height: 'clamp(20px, 4vw, 28px)', maxWidth: '100%', objectFit: 'contain' }} 
      onError={() => {
        console.log(`Failed to load logo for ${service}:`, serviceLogos[service]);
        setLogoError(true);
      }}
    />
  );
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

export default function MiniHeatbarGrid({ selectedServices = SERVICES }) {
  const [data, setData] = React.useState([]);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    async function fetchData() {
      setLoading(true);
      let todayRes, trendRes;
      
      try {
        // Use production API for both development and production
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'https://www.stack-status.io'  // Use production domain in development
          : '';  // Use relative path in production
        
        // Prioritize trend API as it's more reliable
        trendRes = await fetch(`${baseUrl}/api/issue-reports-trend`, { signal }).then(r => r.json());
        
        // Try to fetch today data, but don't fail if it's not available
        try {
          todayRes = await fetch(`${baseUrl}/api/issue-reports-today`, { signal }).then(r => r.json());
        } catch (todayError) {
          console.log('Today API failed, using trend data for today counts');
          todayRes = { data: [] }; // Empty data, will use trend fallback
        }
        
        if (signal.aborted) return;
      } catch (error) {
        if (error.name === 'AbortError') return;
        // Handle other errors - fallback to dummy data
        console.error('Failed to fetch data:', error);
        todayRes = { data: [] };
        trendRes = { trend: {
          Cloudflare: Array(7).fill(0),
          Okta: Array(7).fill(0),
          SendGrid: Array(7).fill(0),
          Zscaler: Array(7).fill(0),
          Slack: Array(7).fill(0),
          Datadog: Array(7).fill(0),
          AWS: Array(7).fill(0),
        } };
      }
      const todayMap = {};
      (todayRes.data || []).forEach(row => {
        todayMap[row.service_name] = Number(row.count);
      });
      const trendMap = trendRes.trend || {};
      const rows = selectedServices.map(service => {
        const trend = sanitizeTrend(trendMap[service]);
        // Always use trend data for today's count if today API is not available
        const todayFromTrend = trend[trend.length - 1] || 0;
        const count = todayMap[service] !== undefined ? todayMap[service] : todayFromTrend;
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
      setLoading(false);
    }
    fetchData();
    
    // Cleanup function to abort requests
    return () => {
      abortController.abort();
    };
  }, [selectedServices, refreshTrigger]);

  // Listen for issue report events to refresh data
  React.useEffect(() => {
    const handleIssueReported = (event) => {
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 1000); // Increased delay to 1 second for better reliability
    };

    window.addEventListener('issueReported', handleIssueReported);
    return () => {
      window.removeEventListener('issueReported', handleIssueReported);
    };
  }, []);

  return (
    <div className="mini-heatbar-grid">
      <div className="mini-heatbar-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>User Reported Issues</span>
        <button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            color: '#666',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'all 0.2s',
            opacity: loading ? 0.5 : 1
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#f0f0f0')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
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
      {data.map((row) => (
        <div className="mini-heatbar-row" key={row.service}>
          <span style={{ minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <ServiceLogo service={row.service} />
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
