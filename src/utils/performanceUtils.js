// Performance monitoring and optimization utilities

// Performance observer for monitoring component renders
export const PerformanceMonitor = {
  // Track component render times
  trackRender: (componentName, renderFn) => {
    if (process.env.NODE_ENV !== 'development') return renderFn();
    
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    if (end - start > 16) { // Flag renders taking longer than one frame
      console.warn(`🐌 Slow render: ${componentName} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },

  // Track API call performance
  trackApiCall: async (apiName, apiFn) => {
    const start = performance.now();
    try {
      const result = await apiFn();
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 API Call: ${apiName} took ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`❌ API Error: ${apiName} failed after ${(end - start).toFixed(2)}ms`, error);
      throw error;
    }
  },

  // Memory usage tracking
  trackMemory: () => {
    if (performance.memory && process.env.NODE_ENV === 'development') {
      const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
      const usedMB = (usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (totalJSHeapSize / 1024 / 1024).toFixed(2);
      console.log(`🧠 Memory: ${usedMB}MB / ${totalMB}MB`);
    }
  }
};

// Debounce utility for performance
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Image optimization utility
export const optimizeImage = (src, options = {}) => {
  const { 
    width = 'auto', 
    height = 'auto', 
    format = 'webp', 
    quality = 80 
  } = options;
  
  // In a real implementation, this would use a service like Cloudinary or similar
  // For now, return the original src with loading optimizations
  return {
    src,
    loading: 'lazy',
    decoding: 'async',
    style: { width, height }
  };
};

// Bundle analyzer helper (for build time)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 Bundle analysis available via: npm run analyze');
  }
};
