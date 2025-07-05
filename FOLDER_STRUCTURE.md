# Project Folder Structure

This document outlines the improved folder structure for better maintainability and scalability.

## Overview

The project has been restructured using feature-based organization and component categorization for better code organization and maintainability.

## New Structure

```
src/
├── components/               # Reusable UI components
│   ├── common/              # Generic components
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   └── RootErrorBoundary.jsx
│   ├── layout/              # Layout components
│   │   └── StatusDigestCarousel.jsx
│   ├── notifications/       # Notification-related
│   │   ├── NotificationBell.jsx
│   │   ├── NotificationBell.css
│   │   └── NotificationChatbot.jsx
│   ├── charts/              # Data visualization
│   │   ├── LineSpark.jsx
│   │   ├── MiniHeatbarGrid.jsx
│   │   ├── MiniHeatbarGrid.css
│   │   ├── TimelineScroller.jsx
│   │   └── TimelineScroller.css
│   └── forms/               # Form components
│       ├── ReportImpactForm.jsx
│       ├── ReportImpactForm.css
│       └── ReportIssueFormStandalone.jsx
├── features/                # Feature-based organization
│   ├── services/            # Service monitoring feature
│   │   ├── components/
│   │   │   ├── LivePulseCard.jsx
│   │   │   ├── LivePulseCard.css
│   │   │   ├── ServiceStatusCard.jsx
│   │   │   ├── ServiceSelectionSplash.jsx
│   │   │   └── ServiceSelectionSplash.css
│   │   └── containers/
│   │       ├── LivePulseCardContainer.jsx
│   │       └── ZscalerPulseCardContainer.jsx
│   └── custom-services/     # Custom service functionality
│       └── components/
│           ├── AddCustomService.jsx
│           ├── AddCustomService.css
│           └── CustomServiceCard.jsx
├── hooks/                   # Custom React hooks (for future use)
├── services/                # API and external services
│   ├── sendgridStatus.js
│   └── serviceLogos.js
├── styles/                  # Global styles and themes
│   ├── globals/
│   │   ├── App.css
│   │   ├── Glassmorphism.css
│   │   └── index.css
│   └── components/          # Component-specific styles (future use)
├── utils/                   # Utility functions
│   ├── dateHelpers.js
│   ├── performance.js
│   ├── seo.js
│   ├── seoAuditor.js
│   └── database-cleanup.js
├── assets/                  # Static assets
├── App.jsx                  # Main application component
└── main.jsx                 # Application entry point
```

## Benefits

### 🚀 **Improved Maintainability**
- Clear separation of concerns
- Easy to locate specific functionality
- Reduced coupling between components

### 📁 **Feature-Based Organization**
- Related components grouped together
- Easier to develop new features
- Better code encapsulation

### 🔍 **Better Discoverability**
- Logical folder hierarchy
- Consistent naming conventions
- Self-documenting structure

### 📈 **Enhanced Scalability**
- Room for growth in each category
- Easy to add new features
- Standardized organization patterns

### 👥 **Developer Experience**
- Faster onboarding for new developers
- Reduced cognitive load
- Consistent import patterns

## Import Path Examples

### Before (Old Structure)
```javascript
import Modal from './Modal';
import ReportImpactForm from './ReportImpactForm';
import { serviceLogos } from './serviceLogos';
```

### After (New Structure)
```javascript
import Modal from '../../../components/common/Modal';
import ReportImpactForm from '../../../components/forms/ReportImpactForm';
import { serviceLogos } from '../../../services/serviceLogos';
```

## Future Enhancements

- **Types**: Add TypeScript type definitions in `src/types/`
- **Hooks**: Custom React hooks in `src/hooks/`
- **Context**: Global state management in `src/context/`
- **Constants**: Application constants in `src/constants/`
- **Tests**: Co-located test files alongside components

## Migration Completed

✅ All components moved to appropriate directories  
✅ Import statements updated throughout codebase  
✅ CSS files organized with their components  
✅ Utility functions consolidated  
✅ Service-related files grouped together  
✅ Duplicate folders removed  

This new structure provides a solid foundation for continued development and maintenance of the Stack Status application.
