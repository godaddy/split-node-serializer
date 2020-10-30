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
    Object.assign(this.cache, { serializedData: await this.generateSerializedData() })
    await this.updateSerializedDataSubsets()
  }

  updateSerializedDataSubsets () {
    return Promise.all(Object.keys(this.cache.serializedDataSubsets).map(async key => {
      this.cache.serializedDataSubsets[key] = await this.generateSerializedData(key.split('.'))
    }))
  }

  async getSerializedDataSubset (splits) {
    const key = splits.sort().join('.')
    if (this.cache.serializedDataSubsets[key]) {
      return this.cache.serializedDataSubsets[key]
    }
    const serializedData = await this.generateSerializedData(splits)
    this.cache.serializedDataSubsets[key] = serializedData
    return serializedData
  }

  async generateSerializedData (splits = []) {
    const latestCache = this.cache

    // If generating serialized data for a subset of splits, get updated segments-related data for the subset
    const serializingSegmentsForSubset = this.serializeSegments && splits.length
    const latestCacheForSubset = {}
    if (serializingSegmentsForSubset) {
      Object.assign(latestCacheForSubset, latestCache)
      const {
        segments,
        usingSegmentsCount
      } = await this.getSegmentsDataForSubset(latestCacheForSubset, splits)
      Object.assign(latestCacheForSubset, { segments, usingSegmentsCount })
    }

    const keyMapping = [
      ['splitsData', 'splits'],
      ['since', 'since'],
      ['segmentsData', 'segments'],
      ['usingSegmentsCount', 'usingSegmentsCount']
    ]
    const splitCachePreload = keyMapping.reduce((acc, [preloadKey, cacheKey]) => {
      if (cacheKey in latestCache) {
        acc[preloadKey] = serializingSegmentsForSubset ? latestCacheForSubset[cacheKey] : latestCache[cacheKey]
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

  async getSegmentsDataForSubset (latestCacheForSubset, splits) {
    // Filter splits based on splits passed into function
    const splitsSubset = Object.keys(latestCacheForSubset.splits)
      .filter(key => splits.includes(key))
      .reduce((obj, key) => {
        return {
          ...obj,
          [key]: latestCacheForSubset.splits[key]
        }
      }, {})

    const subsetSegmentsData = { segments: {}, usingSegmentsCount: 0 }
    try {
      const {
        segments,
        usingSegmentsCount
      } = await this.splitioApiBinding.getSegmentsForSplits({ splits: splitsSubset })
      Object.assign(subsetSegmentsData, { segments, usingSegmentsCount })
    } catch (err) {}

    return subsetSegmentsData
  }

  async start () {
    await this.pollForChanges()
    this.poll()
  }

  poll () {
    this.interval = setInterval(() => this.pollForChanges(), this.pollingRateSeconds * 1000)
    // Do not force the Node.js event loop to remain open if the application is shutting down
    this.interval.unref()
  }

  stop () {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

module.exports = Poller
