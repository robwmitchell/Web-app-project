import React from 'react';
import SearchFeedButton from './feeds/LiveFeedButton';
import NotificationChatbot from './notifications/NotificationChatbot';
import './SideDrawer.css';

const SideDrawer = ({
  isOpen,
  onClose,
  onWorldMapClick,
  onAddRSSClick,
  onSettingsClick,
  onFeedSearchClick,
  showWorldMap,
  showAddCustomModal,
  showSplash,
  showFeedSearchPanel,
  totalFeedItemsCount,
  selectedServices,
  cloudflare,
  zscaler,
  okta,
  sendgrid,
  slack,
  datadog,
  aws
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="drawer-backdrop"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`side-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <h2>Menu</h2>
          </div>
          <button 
            className="drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <span className="close-icon">×</span>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="drawer-nav">
          {/* Live Feed */}
          <div className="drawer-item">
            <div className="drawer-item-header">
              <span className="drawer-item-icon">🔍</span>
              <span className="drawer-item-title">Live Feed</span>
              {totalFeedItemsCount > 0 && (
                <span className="drawer-item-badge">{totalFeedItemsCount}</span>
              )}
            </div>
            <div className="drawer-item-content">
              <SearchFeedButton
                onClick={() => {
                  onFeedSearchClick();
                  onClose();
                }}
                itemCount={totalFeedItemsCount}
                isActive={showFeedSearchPanel}
                drawerMode={true}
              />
            </div>
          </div>

          {/* World Map */}
          <div className="drawer-item">
            <button
              className={`drawer-item-button ${showWorldMap ? 'active' : ''}`}
              onClick={() => {
                onWorldMapClick();
                onClose();
              }}
            >
              <span className="drawer-item-icon">🌍</span>
              <span className="drawer-item-title">World Map</span>
              <span className="drawer-item-arrow">→</span>
            </button>
            <p className="drawer-item-description">
              View global service issues on an interactive map
            </p>
          </div>

          {/* Add RSS Service */}
          <div className="drawer-item">
            <button
              className={`drawer-item-button ${showAddCustomModal ? 'active' : ''}`}
              onClick={() => {
                onAddRSSClick();
                onClose();
              }}
            >
              <span className="drawer-item-icon">➕</span>
              <span className="drawer-item-title">Add RSS Service</span>
              <span className="drawer-item-arrow">→</span>
            </button>
            <p className="drawer-item-description">
              Monitor custom RSS feeds from your services
            </p>
          </div>

          {/* Settings */}
          <div className="drawer-item">
            <button
              className={`drawer-item-button ${showSplash ? 'active' : ''}`}
              onClick={() => {
                onSettingsClick();
                onClose();
              }}
            >
              <span className="drawer-item-icon">⚙️</span>
              <span className="drawer-item-title">Settings</span>
              <span className="drawer-item-arrow">→</span>
            </button>
            <p className="drawer-item-description">
              Configure services and alert preferences
            </p>
          </div>

          {/* Notifications */}
          <div className="drawer-item">
            <div className="drawer-item-header">
              <span className="drawer-item-icon">🔔</span>
              <span className="drawer-item-title">Notifications</span>
            </div>
            <div className="drawer-item-content">
              <NotificationChatbot
                selectedServices={selectedServices}
                cloudflareIncidents={cloudflare.incidents}
                zscalerUpdates={zscaler.updates}
                oktaUpdates={okta.updates}
                sendgridUpdates={sendgrid.updates}
                slackUpdates={slack.updates}
                datadogUpdates={datadog.updates}
                awsUpdates={aws.updates}
                headerMode={false}
                drawerMode={true}
                usePortal={true}
                modalZIndex={20000}
              />
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="drawer-footer">
          <div className="drawer-footer-content">
            <p className="drawer-footer-text">Stack Status Dashboard</p>
            <p className="drawer-footer-version">v2.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideDrawer;
