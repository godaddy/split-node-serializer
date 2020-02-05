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
    this.cache.serializedDataSubsets = {}
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
    } catch (err) {
      this.emit('error', err)
    }
    Object.assign(this.cache, { serializedData: this.generateSerializedData() })
    this.updateSerializedDataSubsets()
  }

  updateSerializedDataSubsets () {
    Object.keys(this.cache.serializedDataSubsets).forEach(key => {
      this.cache.serializedDataSubsets[key] = this.generateSerializedData(key.split('.'))
    })
  }

  getSerializedDataSubset (splits) {
    const key = splits.sort().join('.')
    if (this.cache.serializedDataSubsets[key]) {
      return this.cache.serializedDataSubsets[key]
    }
    const serializedData = this.generateSerializedData(splits)
    this.cache.serializedDataSubsets[key] = serializedData
    return serializedData
  }

  generateSerializedData (splits = []) {
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
          acc[preloadKey] = Object.entries(acc[preloadKey])
            // Filter splits if there were any provided in the 'splits' argument
            .filter(([key, value]) => splits.length === 0 || preloadKey !== 'splitsData' || splits.includes(key))
            // Convert JSON values to strings
            .reduce((obj, [key, value]) => {
              return {
                ...obj,
                [key]: typeof value === 'string' ? value : JSON.stringify(value)
              }
            }, {})
        }
      }
      return acc
    }, {})

    return JSON.stringify(splitCachePreload)
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
}

module.exports = Poller
