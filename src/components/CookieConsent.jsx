import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    } else {
      // Load analytics if consent was given
      const consentData = JSON.parse(consent);
      if (consentData.analytics) {
        loadGoogleAnalytics();
      }
    }
  }, []);

  const loadGoogleAnalytics = () => {
    // Get GA ID from environment variable or use placeholder
    const GA_ID = import.meta.env.VITE_GA_ID || 'G-XXXXXXXXXX';
    
    // Only load if not already loaded and if we have a valid GA ID
    if (!window.gtag && GA_ID !== 'G-XXXXXXXXXX') {
      // Create and append the GA script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', GA_ID, {
        page_title: 'Stack Status IO',
        custom_map: {'custom_parameter_1': 'service_monitoring'}
      });
    }
  };

  const handleAcceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    loadGoogleAnalytics();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const handleShowPreferences = () => {
    setShowPreferences(true);
  };

  const handleSavePreferences = (preferences) => {
    const consent = {
      necessary: true,
      analytics: preferences.analytics,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    
    if (preferences.analytics) {
      loadGoogleAnalytics();
    }
    
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className="cookie-consent-overlay">
        <div className="cookie-consent-banner">
          <div className="cookie-consent-content">
            <div className="cookie-consent-text">
              <h3>🍪 We use cookies</h3>
              <p>
                We use cookies to enhance your browsing experience and analyze our traffic. 
                Essential cookies are required for the site to function properly. Analytics 
                cookies help us understand how you interact with our service status dashboard.
              </p>
            </div>
            <div className="cookie-consent-actions">
              <button 
                className="cookie-btn cookie-btn-reject"
                onClick={handleRejectAll}
              >
                Reject All
              </button>
              <button 
                className="cookie-btn cookie-btn-preferences"
                onClick={handleShowPreferences}
              >
                Manage Preferences
              </button>
              <button 
                className="cookie-btn cookie-btn-accept"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Preferences Modal */}
      {showPreferences && (
        <CookiePreferencesModal 
          onSave={handleSavePreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </>
  );
};

const CookiePreferencesModal = ({ onSave, onClose }) => {
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false
  });

  const handleToggle = (type) => {
    if (type === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSave = () => {
    onSave(preferences);
  };

  return (
    <div className="cookie-preferences-overlay">
      <div className="cookie-preferences-modal">
        <div className="cookie-preferences-header">
          <h3>Cookie Preferences</h3>
          <button className="cookie-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="cookie-preferences-content">
          <div className="cookie-category">
            <div className="cookie-category-header">
              <h4>Necessary Cookies</h4>
              <div className="cookie-toggle">
                <input 
                  type="checkbox" 
                  checked={true} 
                  disabled 
                  id="necessary"
                />
                <label htmlFor="necessary" className="toggle-slider disabled"></label>
              </div>
            </div>
            <p>
              These cookies are essential for the website to function properly. 
              They enable basic features like page navigation and access to secure areas.
            </p>
          </div>

          <div className="cookie-category">
            <div className="cookie-category-header">
              <h4>Analytics Cookies</h4>
              <div className="cookie-toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.analytics} 
                  onChange={() => handleToggle('analytics')}
                  id="analytics"
                />
                <label htmlFor="analytics" className="toggle-slider"></label>
              </div>
            </div>
            <p>
              These cookies help us understand how visitors interact with our website 
              by collecting and reporting information anonymously. We use Google Analytics 
              to improve our service monitoring dashboard.
            </p>
          </div>
        </div>

        <div className="cookie-preferences-actions">
          <button className="cookie-btn cookie-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="cookie-btn cookie-btn-primary" onClick={handleSave}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
