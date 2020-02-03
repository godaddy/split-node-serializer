'use strict'

const { EventEmitter } = require('events')
const { SplitioApiBinding } = require('./splitio-api-binding')

class Poller extends EventEmitter {
  constructor ({
    pollingRateSeconds,
    serializeSegments,
    splitioApiBinding,
    splitioApiKey
  }) {
    super()
    this.cache = {}
    this.pollingRateSeconds = pollingRateSeconds || 300
    this.serializeSegments = serializeSegments || false
    this.splitioApiBinding = splitioApiBinding || new SplitioApiBinding({ splitioApiKey })
    this.interval = null
  }

  async pollForChanges () {
    try {
      const { splits, since } = await this.splitioApiBinding.getSplits()
      Object.assign(this.cache, { splits, since })
      if (this.serializeSegments) {
        const {
          segments,
          usingSegmentsCount
        } = await this.splitioApiBinding.getSegmentsForSplits({ splits })
        Object.assign(this.cache, { segments, usingSegmentsCount })
      }
      this.cachedSerializedDataScript = await this.setCachedSerializedDataScript()
    } catch (err) {
      this.emit('error', err)
    }
    Object.assign(this.cache, { serializedData: this.generateSerializedData() })
  }

  async setCachedSerializedDataScript () {
    const latestCache = this.cache
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
        if (['splitsData', 'segmentsData'].includes(preloadKey)) {
          const data = acc[preloadKey]
          Object.entries(data).forEach(([key, value]) => { data[key] = JSON.stringify(value) })
          acc[preloadKey] = data
        }
      }
      return acc
    }, {})

    return `<script>
      window.__splitCachePreload = ${JSON.stringify(splitCachePreload)};
    </script>`
  }

  async start () {
    await this.pollForChanges()
    this.poll()
  }

  poll () {
    this.interval = setInterval(() => this.pollForChanges(), this.pollingRateSeconds * 1000)
  }

  stop () {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  generateSerializedData () {
    const latestCache = this.cache
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
        if (['splitsData', 'segmentsData'].includes(preloadKey)) {
          const data = acc[preloadKey]
          Object.entries(data).forEach(([key, value]) => { data[key] = typeof value === 'string' ? value : JSON.stringify(value) })
          acc[preloadKey] = data
        }
      }
      return acc
    }, {})

    return JSON.stringify(splitCachePreload)
  }
}

module.exports = Poller
