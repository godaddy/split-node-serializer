'use strict'

class DataSerializer {
  constructor ({ poller }) {
    this.poller = poller
  }

  /**
   * Get latest split and segment data and return a script containing serialized strings.
   */
  generateSerializedDataScript () {
    const latestCache = this.poller.cache
    const keyMapping = [
      ['splitsData', 'splits'],
      ['since', 'since'],
      ['segmentsData', 'segments'],
      ['usingSegmentsCount', 'usingSegmentsCount']
    ]
    const splitCachePreload = keyMapping.reduce((acc, [preloadKey, cacheKey]) => {
      if (cacheKey in latestCache) {
        acc[preloadKey] = latestCache[cacheKey]
        // Serialize values for splits and segments
        if(['splitsData', 'segmentsData'].includes(preloadKey)) {
          const data = acc[preloadKey]
          Object.entries(data).forEach(([key, value]) => data[key] = JSON.stringify(value))
          acc[preloadKey] = data
        }
      }
      return acc
    }, {})

    return `<script>
      window.__splitCachePreload = ${JSON.stringify(splitCachePreload)};
    </script>`
  }
}

module.exports = DataSerializer
