import { describe, it, expect, beforeEach, vi } from 'vitest'

// Test cache service logic
describe('LRU Cache Logic', () => {
  let cache: Map<string, { value: unknown; accessTime: number; size: number }>

  beforeEach(() => {
    cache = new Map()
  })

  function setCache(key: string, value: unknown, maxSize = 5) {
    if (cache.size >= maxSize) {
      // LRU eviction: remove oldest accessed
      let oldestKey = ''
      let oldestTime = Infinity
      for (const [k, v] of cache) {
        if (v.accessTime < oldestTime) {
          oldestTime = v.accessTime
          oldestKey = k
        }
      }
      if (oldestKey) cache.delete(oldestKey)
    }
    cache.set(key, { value, accessTime: Date.now(), size: JSON.stringify(value).length })
  }

  function getCache(key: string) {
    const entry = cache.get(key)
    if (!entry) return undefined
    entry.accessTime = Date.now()
    return entry.value
  }

  it('should store and retrieve values', () => {
    setCache('key1', 'value1')
    expect(getCache('key1')).toBe('value1')
  })

  it('should return undefined for missing keys', () => {
    expect(getCache('nonexistent')).toBeUndefined()
  })

  it('should evict LRU entry when full', async () => {
    for (let i = 0; i < 5; i++) {
      setCache(`key${i}`, `value${i}`, 5)
      await new Promise(r => setTimeout(r, 5)) // Ensure different timestamps
    }

    // Access key0 to make it most recently used
    getCache('key0')
    await new Promise(r => setTimeout(r, 5))

    // Add a 6th entry - should evict key1 (least recently used after key0 was accessed)
    setCache('key5', 'value5', 5)

    expect(cache.has('key0')).toBe(true) // Was accessed, shouldn't be evicted
    expect(cache.has('key5')).toBe(true) // Newly added
    expect(cache.size).toBe(5)
  })
})
