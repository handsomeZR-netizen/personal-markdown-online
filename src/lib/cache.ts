/**
 * Simple in-memory cache for query results
 * In production, consider using Redis or similar
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache data with TTL (time to live) in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Invalidate cache by key or pattern
   */
  invalidate(keyOrPattern: string): void {
    if (keyOrPattern.includes('*')) {
      // Pattern matching
      const pattern = keyOrPattern.replace('*', '')
      const keysToDelete: string[] = []
      
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key)
        }
      }
      
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      // Exact match
      this.cache.delete(keyOrPattern)
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const queryCache = new QueryCache()

/**
 * Helper function to wrap queries with caching
 */
export async function withCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 60000
): Promise<T> {
  // Try to get from cache
  const cached = queryCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute query
  const result = await queryFn()

  // Store in cache
  queryCache.set(key, result, ttl)

  return result
}
