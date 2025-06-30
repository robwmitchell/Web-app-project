import React, { useState, useEffect } from 'react';
import './LivePulseCard.css';
import './Glassmorphism.css';
import { serviceLogos } from './serviceLogos';

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
  onClose, // new prop for close functionality
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

  const handleClose = (e) => {
    e.stopPropagation(); // Prevent any card interactions
    if (onClose) {
      onClose(provider);
    }
  };

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
      {/* Card background logo */}
      <img
        src={serviceLogos[provider]}
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
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div className={`card-accent ${provider.toLowerCase()}`}></div>
            {/* Logo in white rounded box */}
            {serviceLogos[provider] && (
              <div style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                marginRight: 10,
              }}>
                <img src={serviceLogos[provider]} alt={provider + ' logo'} style={{ width: 32, height: 32, borderRadius: 8 }} />
              </div>
            )}
            {/* Name and status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
              <span style={{ fontWeight: 800, fontSize: '1.35em', color: '#1e293b', letterSpacing: '-0.01em' }}>{name || provider}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-indicator ${indicator}`} title={indicator} style={{ boxShadow: '0 0 0 4px #f3f4f6, 0 2px 8px rgba(15,23,42,0.08)' }}></span>
                <span className="status-text" style={{ fontWeight: 600, color: '#64748b', fontSize: '1.08em' }}>{status}</span>
              </span>
            </div>
            {/* Card action buttons - right aligned */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
              {/* Plus/Minus Icon Button */}
              <button
                className="card-plus-btn"
                onClick={() => setFlipped(f => !f)}
                aria-label={flipped ? "Hide info" : "Show more info"}
                style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ fontSize: 22, fontWeight: 700, color: '#888' }}>{flipped ? '−' : '+'}</span>
              </button>
            </div>
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
      {/* Close button - top right corner */}
      {onClose && (
        <button
          className="card-close-btn"
          onClick={handleClose}
          aria-label="Close card"
          title="Close this service card"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 20,
            height: 20,
            minWidth: 20,
            minHeight: 20,
            maxWidth: 20,
            maxHeight: 20,
            background: '#ff5f57',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            flexShrink: 0,
            padding: 0,
          }}
          onMouseEnter={e => {
            e.target.style.background = '#ff3b30';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => {
            e.target.style.background = '#ff5f57';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1 }}>×</span>
        </button>
      )}
    </div>
  );
}
