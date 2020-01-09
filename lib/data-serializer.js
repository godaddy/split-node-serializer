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
          Object.keys(acc[preloadKey]).forEach(key => acc[preloadKey][key] = JSON.stringify(acc[preloadKey][key]))
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
