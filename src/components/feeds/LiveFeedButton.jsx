import React, { useState, useEffect } from 'react';
import './LiveFeedButton.css';

const LiveFeedButton = ({ 
  onClick, 
  hasNewItems = false, 
  itemCount = 0, 
  isActive = false 
}) => {
  const [pulseCount, setPulseCount] = useState(0);

  // Trigger pulse animation when new items arrive
  useEffect(() => {
    if (hasNewItems) {
      setPulseCount(prev => prev + 1);
    }
  }, [hasNewItems]);

  return (
    <button
      className={`live-feed-btn ${isActive ? 'active' : ''} ${hasNewItems ? 'has-new-items' : ''}`}
      onClick={onClick}
      title="Open Live Feed Panel"
      aria-label={`Open live feed panel${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
      data-pulse-count={pulseCount}
    >
      <div className="feed-btn-content">
        <div className="feed-icon-container">
          <span className="feed-icon">📡</span>
          <div className="live-pulse-ring"></div>
        </div>
        
        <div className="feed-btn-text">
          <span className="feed-label">Live Feed</span>
          {itemCount > 0 && (
            <span className="feed-count">{itemCount}</span>
          )}
        </div>
        
        {hasNewItems && (
          <div className="new-indicator">
            <span className="new-dot"></span>
            <span className="new-text">NEW</span>
          </div>
        )}
      </div>
      
      <div className="feed-btn-tooltip">
        <div className="tooltip-content">
          <strong>🔴 Live Feed Panel</strong>
          <div className="tooltip-details">
            <div>• Real-time updates from all services</div>
            <div>• Search and filter capabilities</div>
            <div>• Unified incident tracking</div>
            {itemCount > 0 && <div>• {itemCount} active items</div>}
          </div>
        </div>
      </div>
    </button>
  );
};

export default LiveFeedButton;
