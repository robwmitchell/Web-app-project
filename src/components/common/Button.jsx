import React from 'react';

export default function Button({ children, onClick, type = 'button', style = {}, disabled = false, ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#ccc' : '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        padding: '8px 18px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
