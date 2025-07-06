import React from 'react';
import ZscalerPulseCardContainer from '../containers/ZscalerPulseCardContainer';

// Memoized version to prevent unnecessary re-renders
const MemoizedZscalerPulseCardContainer = React.memo(({ 
  provider, 
  name, 
  indicator, 
  status, 
  updates, 
  onClose 
}) => {
  return (
    <ZscalerPulseCardContainer
      provider={provider}
      name={name}
      indicator={indicator}
      status={status}
      updates={updates}
      onClose={onClose}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.provider === nextProps.provider &&
    prevProps.name === nextProps.name &&
    prevProps.indicator === nextProps.indicator &&
    prevProps.status === nextProps.status &&
    prevProps.updates?.length === nextProps.updates?.length &&
    prevProps.onClose === nextProps.onClose
  );
});

MemoizedZscalerPulseCardContainer.displayName = 'MemoizedZscalerPulseCardContainer';

export default MemoizedZscalerPulseCardContainer;
