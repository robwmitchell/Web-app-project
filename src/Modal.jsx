import React from 'react';

export default function Modal({ open, onClose, title, children, enhanced = false }) {
  if (!open) return null;
  
  if (enhanced) {
    return (
      <div style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        background: 'rgba(0,0,0,0.4)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          minWidth: 420,
          maxWidth: 600,
          width: '100%',
          maxHeight: '80vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          animation: 'slideIn 0.2s ease-out'
        }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid #f0f0f0', 
            fontWeight: 600, 
            fontSize: 16,
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{title}</span>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                color: '#666',
                padding: 4,
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >×</button>
          </div>
          <div style={{ 
            maxHeight: 'calc(80vh - 60px)', 
            overflowY: 'auto',
            padding: 0
          }}>
            {children}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, minWidth: 340, maxWidth: 600, boxShadow: '0 2px 16px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1.2em' }}>{title}</h2>
          <button onClick={onClose} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}
