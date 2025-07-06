import React, { useState, useEffect } from 'react';
import './LivePulseCard.css';
import '../../../styles/globals/Glassmorphism.css';
import { serviceLogos } from '../../../services/serviceLogos';
import ServiceTimeline from '../../../components/charts/ServiceTimeline';

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
  incidents = [], // new prop for timeline
  updates = [], // new prop for timeline
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
          <div className="card-header-modern" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '18px 20px 18px 0',
            borderRadius: '18px 18px 0 0',
            background: 'rgba(255,255,255,0.55)',
            boxShadow: '0 4px 24px 0 rgba(30,41,59,0.07)',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            minHeight: 72,
            borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
            zIndex: 2,
          }}>
            {/* Accent bar */}
            <div style={{
              width: 6,
              height: 48,
              borderRadius: 6,
              background: `linear-gradient(135deg, #1976d2 0%, #60a5fa 100%)`,
              marginRight: 18,
              boxShadow: '0 2px 8px rgba(30,41,59,0.10)'
            }} />
            {/* Logo in glassy circle */}
            {serviceLogos[provider] && (
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(15,23,42,0.10)',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                minWidth: 56,
                minHeight: 56,
                marginRight: 10,
              }}>
                <img src={serviceLogos[provider]} alt={provider + ' logo'} style={{ width: 36, height: 36, borderRadius: 12 }} />
              </div>
            )}
            {/* Name and status row */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 900, fontSize: '1.45em', color: '#1e293b', letterSpacing: '-0.01em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name || provider}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <span className={`status-indicator ${indicator}`} title={indicator} style={{ boxShadow: '0 0 0 4px #f3f4f6, 0 2px 8px rgba(15,23,42,0.08)' }}></span>
                <span className="status-text" style={{ fontWeight: 600, color: '#64748b', fontSize: '1.08em' }}>{status}</span>
              </span>
            </div>
            {/* Close button - top right, vertically centered */}
            {onClose && (
              <button
                className="card-close-btn"
                onClick={handleClose}
                aria-label="Close card"
                title="Close this service card"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 18,
                  transform: 'translateY(-50%)',
                  width: 22,
                  height: 22,
                  minWidth: 22,
                  minHeight: 22,
                  maxWidth: 22,
                  maxHeight: 22,
                  background: '#ff5f57',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
                  flexShrink: 0,
                  padding: 0,
                }}
                onMouseEnter={e => {
                  e.target.style.background = '#ff3b30';
                  e.target.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = '#ff5f57';
                  e.target.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1 }}>×</span>
              </button>
            )}
          </div>
          <div className="live-pulse-headline">{headline}</div>
          
          {/* 7-Day Service Timeline */}
          <ServiceTimeline 
            provider={provider}
            incidents={incidents}
            updates={updates}
            showPercentage={true}
            showLabels={true}
          />
          
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
