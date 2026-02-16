
/**
 * Simulated Redis Cache Service
 * In a production environment, these calls would be API requests to a Redis-backed server.
 * For this dealership platform, we simulate the logic using local storage with simulated latency.
 */

const CACHE_PREFIX = 'MH_REDIS_';

export const cacheService = {
  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Simulate network/redis latency
    await new Promise(resolve => setTimeout(resolve, 300));
    const data = localStorage.getItem(CACHE_PREFIX + key);
    if (!data) return null;
    
    try {
      const entry = JSON.parse(data);
      // Check for expiration if we implemented TTL
      return entry.value as T;
    } catch (e) {
      return null;
    }
  },

  /**
   * Set a value in the cache
   */
  async set(key: string, value: any): Promise<void> {
    // Simulate redis write latency
    await new Promise(resolve => setTimeout(resolve, 100));
    const entry = {
      value,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  },

  /**
   * Flush all dealership cache (Redis FLUSHALL simulation)
   */
  async flush(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(CACHE_PREFIX + key) !== null;
  }
};
