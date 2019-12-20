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
    } catch (err) {
      this.emit('error', err)
    }
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
