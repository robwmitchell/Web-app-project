import React from 'react';
import './LiveFeedButton.css';

const SearchFeedButton = ({ 
  onClick, 
  itemCount = 0, 
  isActive = false,
  drawerMode = false
}) => {
  if (drawerMode) {
    return (
      <button
        className={`drawer-feed-btn ${isActive ? 'active' : ''}`}
        onClick={onClick}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <span>🔍</span>
        <span>Open Feed Search</span>
        {itemCount > 0 && (
          <span style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '2px 6px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            {itemCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      className={`search-feed-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title="Open Feed Search Panel"
      aria-label={`Open feed search panel${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
    >
      <div className="feed-btn-content">
        <div className="feed-icon-container">
          <span className="feed-icon">🔍</span>
        </div>
        
        <div className="feed-btn-text">
          <span className="feed-label">Search Feed</span>
          {itemCount > 0 && (
            <span className="feed-count">{itemCount}</span>
          )}
        </div>
      </div>
      
      <div className="feed-btn-tooltip">
        <div className="tooltip-content">
          <strong>🔍 Feed Search Panel</strong>
          <div className="tooltip-details">
            <div>• Search through all service updates</div>
            <div>• Filter by source and date</div>
            <div>• Unified incident tracking</div>
            {itemCount > 0 && <div>• {itemCount} available items</div>}
          </div>
        </div>
      </div>
    </button>
  );
};

export default SearchFeedButton;
