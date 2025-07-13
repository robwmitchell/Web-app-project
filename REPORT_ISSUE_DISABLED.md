# Report Issue Feature - Temporarily Disabled

## Overview
The "Report Issue" feature has been temporarily disabled across the entire application as it is not ready for production use.

## Changes Made

### 1. Feature Flag Added (App.jsx)
- Added `FEATURE_FLAGS.reportIssueEnabled: false` to centrally control the feature
- Modified `handleReportIssue()` function to check feature flag and exit early if disabled

### 2. Report Issue Buttons Hidden
**LivePulseCardContainer.jsx**:
- Wrapped Report Issue button in `{false && (...)}` to hide it
- Disabled the Report Issue modal with same conditional

**ZscalerPulseCardContainer.jsx**:
- Wrapped Report Issue button in `{false && (...)}` to hide it  
- Disabled the Report Issue modal with same conditional

**CustomServiceCard.jsx**:
- Wrapped Report Issue button in `{false && (...)}` to hide it

### 3. Main Report Issue Modal Disabled (App.jsx)
- Wrapped the main bug report modal in `{FEATURE_FLAGS.reportIssueEnabled && (...)}`
- Modal will not render when feature flag is false

## User Experience
- **Report Issue buttons** are no longer visible on any service cards
- **No modals** will open if any Report Issue functionality is accidentally triggered
- **Clean UI** with only the "View History" button visible in card actions
- **Graceful degradation** - feature can be easily re-enabled by changing the feature flag

## To Re-enable the Feature

### Quick Method (when ready):
1. Change `FEATURE_FLAGS.reportIssueEnabled` to `true` in App.jsx
2. Remove the `{false && (...)}` wrappings from the component buttons

### Production Ready Method:
1. Set `FEATURE_FLAGS.reportIssueEnabled: true` in App.jsx
2. Update button conditionals to use `FEATURE_FLAGS.reportIssueEnabled` instead of `false`
3. Update modal conditionals to use the feature flag consistently

## Files Modified
- `src/App.jsx` - Added feature flag and disabled main modal
- `src/features/services/containers/LivePulseCardContainer.jsx` - Hidden button and modal
- `src/features/services/containers/ZscalerPulseCardContainer.jsx` - Hidden button and modal  
- `src/features/custom-services/components/CustomServiceCard.jsx` - Hidden button

## Testing
- ✅ Build passes successfully
- ✅ No Report Issue buttons visible in UI
- ✅ No broken functionality or UI issues
- ✅ All other features remain functional

---

**Status**: ✅ Disabled  
**Date**: July 13, 2025  
**Reason**: Feature not ready for production  
**Impact**: No user-facing functionality lost, clean UI maintained
