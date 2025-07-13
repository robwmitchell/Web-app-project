import React from 'react';
import './LiveFeedButton.css';

const SearchFeedButton = ({ 
  onClick, 
  itemCount = 0, 
  isActive = false 
}) => {
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
