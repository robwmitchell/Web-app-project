import React from 'react';
import LivePulseCardContainer from '../containers/LivePulseCardContainer';

// Memoized version to prevent unnecessary re-renders
const MemoizedLivePulseCardContainer = React.memo(({ 
  provider, 
  name, 
  indicator, 
  status, 
  incidents, 
  onClose 
}) => {
  return (
    <LivePulseCardContainer
      provider={provider}
      name={name}
      indicator={indicator}
      status={status}
      incidents={incidents}
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
    prevProps.incidents?.length === nextProps.incidents?.length &&
    prevProps.onClose === nextProps.onClose
  );
});

MemoizedLivePulseCardContainer.displayName = 'MemoizedLivePulseCardContainer';

export default MemoizedLivePulseCardContainer;
