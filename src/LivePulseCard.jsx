import React, { useState } from 'react';
import './LivePulseCard.css';
import './Glassmorphism.css';
import cloudflareLogo from './assets/cloudflare-logo.svg';
import oktaLogo from './assets/Okta-logo.svg';
import sendgridLogo from './assets/SendGrid.svg';
import zscalerLogo from './assets/Zscaler.svg';

const LOGOS = {
  Cloudflare: cloudflareLogo,
  Okta: oktaLogo,
  SendGrid: sendgridLogo,
  Zscaler: zscalerLogo,
};

function getThemeClass(indicator, themeOverride) {
  if (themeOverride && themeOverride !== 'auto') {
    if (themeOverride === 'light') return 'theme-light';
    if (themeOverride === 'dark') return 'theme-dark';
  }
  if (indicator === 'none' || indicator === 'minor') return 'theme-light';
  if (indicator === 'major' || indicator === 'critical') return 'theme-dark';
  return 'theme-light';
}

export default function LivePulseCard({
  name,
  provider,
  indicator = 'none',
  status,
  headline,
  onExpand,
  children,
  themeOverride = 'auto',
  companyInfo = null, // new prop for company info
}) {
  const [pop, setPop] = useState(false);
  const [flipped, setFlipped] = useState(false); // flip state
  // Animate pop on live update
  React.useEffect(() => {
    setPop(true);
    const t = setTimeout(() => setPop(false), 600);
    return () => clearTimeout(t);
  }, [headline]);

  const themeClass = getThemeClass(indicator, themeOverride);

  return (
    <div
      className={`live-pulse-card glass-card${pop ? ' live-update-pop' : ''} ${themeClass} ${flipped ? 'flipped' : ''}`}
      style={{ perspective: '1000px', minHeight: 180, minWidth: 280, position: 'relative' }}
    >
      <div
        className="card-flip-inner"
        style={{
          transition: 'transform 0.6s cubic-bezier(.4,2,.6,1)',
          transformStyle: 'preserve-3d',
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: flipped ? 'rotateY(180deg)' : 'none',
        }}
      >
        {/* Front Side */}
        <div
          className="card-flip-front"
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
          }}
        >
          {/* Company Info Button - top right */}
          <button
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              background: '#f5f5f5',
              border: 'none',
              borderRadius: 4,
              padding: '4px 10px',
              cursor: 'pointer',
              fontWeight: 500,
              zIndex: 2,
              boxShadow: '0 1px 6px 0 #0001',
            }}
            onClick={() => setFlipped(true)}
            aria-label="Show company info"
          >
            Company Info
          </button>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            {LOGOS[provider] && (
              <img src={LOGOS[provider]} alt={provider + ' logo'} className="card-icon glass-icon" style={{ width: 28, height: 28, marginRight: 8 }} />
            )}
            <span style={{ fontWeight: 600, fontSize: '1.1em', marginRight: 8 }}>{name || provider}</span>
            <span className={`status-indicator ${indicator}`} title={indicator}></span>
          </div>
          <div className="live-pulse-headline">{headline}</div>
          <button
            style={{ marginTop: 12, background: '#eee', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontWeight: 500 }}
            onClick={onExpand}
          >
            View last 7 days
          </button>
          {children}
        </div>
        {/* Back Side */}
        <div
          className="card-flip-back"
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: 8 }}>{name || provider} Info</div>
          <div style={{ fontSize: '0.98em', color: '#333', marginBottom: 12, textAlign: 'center' }}>
            {companyInfo || 'No company information provided.'}
          </div>
          <button
            style={{ background: '#eee', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => setFlipped(false)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
