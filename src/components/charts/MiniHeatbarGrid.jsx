import React from 'react';
import './MiniHeatbarGrid.css';
import { serviceLogos } from '../../services/serviceLogos';

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
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  
  // Use service logos mapping with case-insensitive lookup
  let logoSrc = serviceLogos[service];
  if (!logoSrc) {
    // Try to find a case-insensitive match
    const serviceKey = Object.keys(serviceLogos).find(
      key => key.toLowerCase() === service.toLowerCase()
    );
    logoSrc = serviceKey ? serviceLogos[serviceKey] : null;
  }
  
  // Debug: log logo information
  React.useEffect(() => {
    console.log(`ServiceLogo for "${service}":`, { 
      service, 
      logoSrc, 
      logoError, 
      logoLoaded
    });
  }, [service, logoSrc, logoError, logoLoaded]);
  
  if (!logoSrc) {
    console.warn(`No logo source found for service: ${service}`);
    // If no logo mapping exists, show a generic service icon
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', background: 'rgba(248, 250, 252, 0.9)', borderRadius: '8px',
        fontSize: '16px', color: '#64748b', minWidth: '32px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 2px 8px rgba(30, 41, 59, 0.08)',
        backdropFilter: 'blur(8px)'
      }}>
        🏢
      </div>
    );
  }
  
  // Show error state if logo failed to load
  if (logoError) {
    console.warn(`Logo failed to load for service: ${service}, src: ${logoSrc}`);
    // Show a service-specific emoji or icon instead of letter
    const serviceIcons = {
      'Cloudflare': '☁️',
      'Okta': '🔐',
      'SendGrid': '📧',
      'Zscaler': '🛡️',
      'Slack': '💬',
      'Datadog': '📊',
      'AWS': '☁️'
    };
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', background: 'rgba(255, 243, 205, 0.9)', borderRadius: '8px',
        fontSize: '14px', minWidth: '32px',
        border: '1px solid rgba(255, 234, 167, 0.6)',
        boxShadow: '0 2px 8px rgba(30, 41, 59, 0.08)',
        backdropFilter: 'blur(8px)'
      }}>
        {serviceIcons[service] || '🏢'}
      </div>
    );
  }
  
  // Show the loaded logo
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '32px', height: '32px', minWidth: '32px',
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '8px',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      padding: '4px',
      boxShadow: '0 2px 8px rgba(30, 41, 59, 0.08)',
      backdropFilter: 'blur(8px)'
    }}>
      <img 
        src={logoSrc} 
        alt={`${service} logo`} 
        style={{ 
          width: '24px', 
          height: '24px', 
          objectFit: 'contain'
        }} 
        onLoad={() => {
          console.log(`✅ Logo loaded successfully for ${service} from ${logoSrc}`);
          setLogoLoaded(true);
        }}
        onError={(e) => {
          console.error(`❌ Failed to load logo for ${service} from ${logoSrc}:`, e);
          setLogoError(true);
        }}
      />
    </div>
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
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        <polygon points={areaStr} fill={`url(#gradient-${color.replace('#', '')})`} />
        <polyline fill="none" stroke={color} strokeWidth="2" points={lineStr} style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))' }} />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill={color} style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.2))' }} />
        ))}
      </svg>
    </div>
  );
}

export default function MiniHeatbarGrid({ 
  selectedServices = SERVICES, 
  closedCards = [], 
  onCloseCard, 
  onRestoreCard, 
  onRestoreAllCards 
}) {
  const [trendData, setTrendData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Convert closedCards array to Set for easier lookup, ensuring case-insensitive matching
  const closedServices = React.useMemo(() => {
    return new Set(closedCards.map(card => card.toLowerCase()));
  }, [closedCards]);

  // Functions to handle closing and restoring services
  const closeService = (serviceName) => {
    if (onCloseCard) {
      onCloseCard(serviceName);
    }
  };

  const restoreService = (serviceName) => {
    if (onRestoreCard) {
      onRestoreCard(serviceName);
    }
  };

  // Debug: log service logos on component mount and preload them
  React.useEffect(() => {
    console.log('Available service logos:', serviceLogos);
    console.log('Selected services:', selectedServices);
    
    // Preload all logos to help with loading
    selectedServices.forEach(service => {
      let logoSrc = serviceLogos[service];
      if (!logoSrc) {
        // Try to find a case-insensitive match
        const serviceKey = Object.keys(serviceLogos).find(
          key => key.toLowerCase() === service.toLowerCase()
        );
        logoSrc = serviceKey ? serviceLogos[serviceKey] : null;
      }
      
      if (logoSrc) {
        console.log(`Attempting to preload logo for ${service}: ${logoSrc}`);
        const img = new Image();
        img.onload = () => console.log(`✅ Preloaded logo for ${service}`);
        img.onerror = (e) => console.error(`❌ Failed to preload logo for ${service}:`, e);
        img.src = logoSrc;
      }
    });
  }, [selectedServices]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/issue-reports-latest?endpoint=trend')
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
  }, [selectedServices]);

  // Debug: log closed services synchronization
  React.useEffect(() => {
    console.log('MiniHeatbarGrid - Closed cards from App:', closedCards);
    console.log('MiniHeatbarGrid - Closed services Set:', closedServices);
    console.log('MiniHeatbarGrid - Selected services:', selectedServices);
  }, [closedCards, closedServices, selectedServices]);

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

  // Filter out closed services (case-insensitive)
  const visibleRows = rows.filter(row => !closedServices.has(row.service.toLowerCase()));

  return (
    <div className="mini-heatbar-grid">
      <div className="mini-heatbar-title" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '1200px',
        padding: '0 32px',
        marginBottom: '24px'
      }}>
        <span style={{
          fontSize: '1.3em',
          fontWeight: '800',
          color: '#1e293b',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.2em' }}>📊</span>
          User Reported Issues
        </span>
      </div>
      <div className="mini-heatbar-header" style={{ fontWeight: 700, fontSize: '1.08em' }}>
        <span>Logo</span>
        <span>Service</span>
        <span>Trend (7 days)</span>
        <span>Today</span>
        <span style={{ width: '32px' }}></span> {/* Space for close button */}
      </div>
      {visibleRows.map(row => {
        // Debug log for each row
        console.log(`Rendering row for service: "${row.service}"`);
        return (
          <div 
            className="mini-heatbar-row" 
            key={row.service} 
            style={{ 
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.4)',
              borderRadius: '8px',
              margin: '4px 16px',
              padding: '8px 16px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(30, 41, 59, 0.04)'
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(255, 255, 255, 0.6)';
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(30, 41, 59, 0.08)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(255, 255, 255, 0.4)';
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 1px 3px rgba(30, 41, 59, 0.04)';
            }}
          >
            <span style={{ minWidth: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ServiceLogo service={row.service} />
            </span>
            <span style={{ 
              minWidth: 80, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              paddingLeft: '8px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '0.95em'
            }}>
              {row.service}
            </span>
            <span className="mini-heatbar-trend">
              <AreaSpark data={row.trend} color="#d32f2f" fill="#ffd6d6" />
            </span>
            <span className="mini-heatbar-reports">{row.count} <span className={row.trendUp ? 'up' : 'down'}>{getTrendArrow(row.trendUp)}</span></span>
            <span style={{ width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => closeService(row.service)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  cursor: 'pointer',
                  fontSize: '12px', 
                  color: '#dc2626', 
                  padding: '0', 
                  borderRadius: '50%',
                  transition: 'all 0.2s ease', 
                  opacity: 0.7,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '20px', 
                  height: '20px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
                  fontWeight: '600'
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.9)';
                  e.target.style.borderColor = '#dc2626';
                  e.target.style.color = '#ffffff';
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  e.target.style.color = '#dc2626';
                  e.target.style.opacity = '0.7';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.1)';
                }}
                title={`Hide ${row.service} from dashboard`}
                aria-label={`Close ${row.service} card`}
              >
                ×
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
