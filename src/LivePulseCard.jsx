import React, { useState, useEffect } from 'react';
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

// Icon mapping for status
const STATUS_ICONS = {
  none: { icon: '✔', color: '#4caf50', emoji: '🟢' }, // operational
  minor: { icon: '⚠', color: '#ff9800', emoji: '🟠' }, // partial outage
  major: { icon: '❌', color: '#f44336', emoji: '🔴' }, // major issue
  critical: { icon: '❌', color: '#b71c1c', emoji: '🔴' }, // major/critical
  unknown: { icon: '?', color: '#757575', emoji: '❔' }, // unknown
};

export default function LivePulseCard({
  name,
  provider,
  indicator = 'none',
  status,
  headline,
  onExpand,
  children,
  companyInfo = null,
  onBugClick, // new prop
}) {
  const [pop, setPop] = useState(false);
  const [flipped, setFlipped] = useState(false); // flip state
  const [bgVisible, setBgVisible] = useState(true);

  // Animate pop on live update
  React.useEffect(() => {
    setPop(true);
    const t = setTimeout(() => setPop(false), 600);
    return () => clearTimeout(t);
  }, [headline]);

  // Fade out background image after 4 seconds
  useEffect(() => {
    setBgVisible(true);
    const timer = setTimeout(() => setBgVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [provider]);

  return (
    <div
      className={`live-pulse-card glass-card${pop ? ' live-update-pop' : ''} ${flipped ? 'flipped' : ''}`}
      style={{
        perspective: '1000px',
        minHeight: 180,
        minWidth: 280,
        position: 'relative',
      }}
    >
      {/* Plus/Minus Icon Button - top right of card container */}
      <button
        className="card-plus-btn"
        onClick={() => setFlipped(f => !f)}
        aria-label={flipped ? "Hide info" : "Show more info"}
        style={{ position: 'absolute', top: 10, right: 12, width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', zIndex: 3 }}
      >
        <span style={{ fontSize: 22, fontWeight: 700, color: '#888' }}>{flipped ? '−' : '+'}</span>
      </button>
      {/* Card background logo */}
      <img
        src={LOGOS[provider]}
        alt={provider + ' background'}
        className={`card-bg-logo${bgVisible ? '' : ' card-bg-logo-fade'}`}
        aria-hidden="true"
      />
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
          {/* Company Info Button - hidden, but kept for revertability */}
          {/*
          <button
            className="company-info-btn"
            onClick={() => setFlipped(true)}
            aria-label="Show company info"
          >
            Company Info
          </button>
          */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            {LOGOS[provider] && (
              <img src={LOGOS[provider]} alt={provider + ' logo'} className="card-icon glass-icon" style={{ width: 28, height: 28, marginRight: 8 }} />
            )}
            <span style={{ fontWeight: 600, fontSize: '1.1em', marginRight: 8 }}>{name || provider}</span>
            <span className={`status-indicator ${indicator}`} title={indicator}></span>
            <span className="status-text" style={{ marginLeft: 8, fontWeight: 500, color: '#555', fontSize: '1em' }}>{status}</span>
          </div>
          <div className="live-pulse-headline">{headline}</div>
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
      {/* Place both buttons in a single row at the bottom of the card */}
      {/* Removed card-bottom-row and buttons; now handled by parent via children */}
    </div>
  );
}
