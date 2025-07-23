// Request manager utility to prevent duplicate API calls and optimize caching

class RequestManager {
  constructor() {
    this.cache = new Map();
    this.inFlightRequests = new Map();
    this.defaultCacheDuration = 30 * 1000; // 30 seconds default cache
  }

  // Get a cached response or make a new request
  async fetch(url, options = {}, cacheDuration = this.defaultCacheDuration) {
    const cacheKey = this.getCacheKey(url, options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.response.clone();
    }

    // Check if request is already in flight
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    // Make new request
    const requestPromise = this.makeRequest(url, options)
      .then(response => {
        // Cache the response
        this.cache.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now()
        });
        
        // Remove from in-flight requests
        this.inFlightRequests.delete(cacheKey);
        
        return response;
      })
      .catch(error => {
        // Remove from in-flight requests on error
        this.inFlightRequests.delete(cacheKey);
        throw error;
      });

    // Store in-flight request
    this.inFlightRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  // Make the actual fetch request
  async makeRequest(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  }

  // Generate cache key from URL and options
  getCacheKey(url, options) {
    const optionsKey = JSON.stringify({
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null
    });
    return `${url}::${optionsKey}`;
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.defaultCacheDuration * 2) {
        this.cache.delete(key);
      }
    }
  }

  // Manually clear cache for specific URL pattern
  clearCache(urlPattern) {
    if (!urlPattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      inFlightRequests: this.inFlightRequests.size,
      cacheEntries: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const requestManager = new RequestManager();

// Enhanced fetch function that uses request manager
export const optimizedFetch = (url, options = {}, cacheDuration) => {
  return requestManager.fetch(url, options, cacheDuration);
};

// Periodically clean up expired cache entries
setInterval(() => {
  requestManager.clearExpiredCache();
}, 60 * 1000); // Clean up every minute

export default requestManager;
