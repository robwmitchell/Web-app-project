import React from 'react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
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
