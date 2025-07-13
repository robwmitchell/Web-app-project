# Cookie Consent Implementation

## Overview
Stack Status IO now includes a GDPR/CCPA compliant cookie consent system that manages user preferences for analytics cookies.

## Features
- **Compliant Banner**: Non-intrusive banner that appears on first visit
- **Granular Control**: Users can accept all, reject all, or manage individual preferences
- **Analytics Integration**: Google Analytics only loads after user consent
- **Persistent Storage**: User preferences are saved in localStorage
- **Dark Mode Support**: Matches your app's theme
- **Mobile Responsive**: Works perfectly on all device sizes

## How It Works

### 1. Initial State
- When users first visit, the cookie consent banner appears at the bottom
- Google Analytics is **NOT** loaded until consent is given
- Only essential cookies (localStorage for app preferences) are active

### 2. User Choices
- **Accept All**: Loads Google Analytics and saves consent
- **Reject All**: No analytics tracking, only essential functionality
- **Manage Preferences**: Detailed modal with toggle controls

### 3. Consent Management
- User preferences are stored in `localStorage` as `cookieConsent`
- Includes timestamp and individual category consent
- Future visits respect the saved preference

## Configuration

### Google Analytics Setup
1. Get your GA4 Measurement ID from Google Analytics
2. Add it to your environment variables:
   ```bash
   # In .env.development or .env.local
   VITE_GA_ID=G-YOUR-ACTUAL-ID
   ```

### Customization
The cookie consent component supports:
- Custom messaging in `CookieConsent.jsx`
- Visual styling in `CookieConsent.css`
- Cookie categories (currently: Necessary, Analytics)

## Privacy Compliance

### What We Track
- **With Consent**: Google Analytics (page views, user interactions)
- **Always**: Essential app preferences in localStorage (theme, service selections)

### What We Don't Track
- No cross-site tracking
- No advertising cookies
- No personal data collection
- No third-party marketing tools

## Technical Implementation

### Components
- `CookieConsent.jsx`: Main consent banner and logic
- `CookiePreferencesModal`: Detailed preference management
- `CookieConsent.css`: Responsive styles with dark mode

### Integration
- Integrated into `App.jsx` as a portal component
- Google Analytics script removed from `index.html`
- Analytics only loads post-consent via JavaScript

## Legal Compliance
✅ **GDPR Compliant**: Explicit consent before non-essential cookies
✅ **CCPA Compliant**: Clear opt-out mechanism
✅ **Transparent**: Clear description of what data is collected
✅ **User Control**: Granular preference management

## Future Enhancements
- Additional cookie categories (Marketing, Functional)
- Integration with cookie management services
- Analytics for consent rates
- Multi-language support

---

**Note**: This implementation prioritizes user privacy while maintaining essential functionality. Analytics are completely optional and the app works fully without them.
