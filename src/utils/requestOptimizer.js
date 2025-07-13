// Request optimization and caching utility
// Prevents duplicate API calls and adds intelligent caching

class RequestCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Generate cache key from URL and options
  getCacheKey(url, options = {}) {
    const key = {
      url,
      method: options.method || 'GET',
      headers: JSON.stringify(options.headers || {}),
      body: options.body || null
    };
    return JSON.stringify(key);
  }

  // Check if cache entry is still valid
  isValid(entry, maxAge) {
    if (!entry) return false;
    const age = Date.now() - entry.timestamp;
    return age < maxAge;
  }

  // Get cached response
  get(url, options, maxAge) {
    const key = this.getCacheKey(url, options);
    const entry = this.cache.get(key);
    
    if (this.isValid(entry, maxAge)) {
      console.log(`[Cache] Hit for ${url}`);
      return Promise.resolve(entry.response.clone());
    }
    
    return null;
  }

  // Set cached response
  set(url, options, response) {
    const key = this.getCacheKey(url, options);
    const entry = {
      response: response.clone(),
      timestamp: Date.now()
    };
    
    this.cache.set(key, entry);
    console.log(`[Cache] Stored ${url}`);
  }

  // Get or create pending request to prevent duplicates
  getPendingRequest(url, options) {
    const key = this.getCacheKey(url, options);
    return this.pendingRequests.get(key);
  }

  setPendingRequest(url, options, promise) {
    const key = this.getCacheKey(url, options);
    this.pendingRequests.set(key, promise);
    
    // Clean up when request completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    const maxCacheAge = 10 * 60 * 1000; // 10 minutes max cache age
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxCacheAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const requestCache = new RequestCache();

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  requestCache.cleanup();
}, 5 * 60 * 1000);

// Cache durations for different types of requests (in milliseconds)
export const CACHE_DURATIONS = {
  STATUS_API: 1 * 60 * 1000,      // 1 minute for status APIs
  RSS_FEEDS: 2 * 60 * 1000,       // 2 minutes for RSS feeds
  STATIC_DATA: 5 * 60 * 1000,     // 5 minutes for static data
  NOTIFICATIONS: 30 * 1000        // 30 seconds for notifications
};

// Optimized fetch function with caching and deduplication
export async function optimizedFetch(url, options = {}, cacheMaxAge = CACHE_DURATIONS.STATUS_API) {
  // Check cache first
  const cachedResponse = requestCache.get(url, options, cacheMaxAge);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Check for pending request to avoid duplicates
  const pendingRequest = requestCache.getPendingRequest(url, options);
  if (pendingRequest) {
    console.log(`[Request] Deduplicating ${url}`);
    return pendingRequest;
  }

  // Make new request
  console.log(`[Request] Fetching ${url}`);
  const requestPromise = fetch(url, options)
    .then(response => {
      if (response.ok) {
        // Cache successful responses
        requestCache.set(url, options, response);
      }
      return response;
    })
    .catch(error => {
      console.error(`[Request] Failed ${url}:`, error);
      throw error;
    });

  // Track pending request
  requestCache.setPendingRequest(url, options, requestPromise);

  return requestPromise;
}

// Batch multiple API calls with intelligent scheduling
export class APIBatchScheduler {
  constructor() {
    this.pendingBatches = new Map();
    this.batchDelay = 100; // 100ms delay to collect batch calls
  }

  // Schedule API call to be batched
  schedule(batchKey, apiCall) {
    if (!this.pendingBatches.has(batchKey)) {
      this.pendingBatches.set(batchKey, []);
      
      // Execute batch after delay
      setTimeout(() => {
        const calls = this.pendingBatches.get(batchKey) || [];
        this.pendingBatches.delete(batchKey);
        
        if (calls.length > 0) {
          console.log(`[Batch] Executing ${calls.length} calls for ${batchKey}`);
          calls.forEach(call => call());
        }
      }, this.batchDelay);
    }
    
    this.pendingBatches.get(batchKey).push(apiCall);
  }
}

// Global batch scheduler
export const apiBatchScheduler = new APIBatchScheduler();

// Request performance monitoring
export const RequestMonitor = {
  requests: new Map(),
  
  start(url) {
    this.requests.set(url, {
      startTime: performance.now(),
      url
    });
  },
  
  end(url, success = true) {
    const request = this.requests.get(url);
    if (request) {
      const duration = performance.now() - request.startTime;
      console.log(`[Performance] ${url} took ${duration.toFixed(2)}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
      this.requests.delete(url);
      
      // Warn about slow requests
      if (duration > 3000) {
        console.warn(`[Performance] Slow request: ${url} took ${duration.toFixed(2)}ms`);
      }
    }
  },
  
  // Get performance statistics
  getStats() {
    const activeRequests = this.requests.size;
    return { activeRequests };
  }
};
