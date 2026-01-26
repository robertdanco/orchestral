/**
 * Common interface for all cache implementations.
 * Each cache stores data from a specific source and tracks when it was last refreshed.
 */
export interface ICache {
  /**
   * Returns the date when the cache was last refreshed, or null if never refreshed.
   */
  getLastRefreshed(): Date | null;

  /**
   * Clears all cached data and resets the last refreshed timestamp.
   */
  clear(): void;

  /**
   * Returns true if the cache contains no data.
   */
  isEmpty(): boolean;
}
