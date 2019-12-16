'use strict'

const { EventEmitter } = require('events')

class Poller extends EventEmitter {
  constructor ({
    pollingRateSeconds,
    serializeSegments,
    splitioApiBinding
  }) {
    super()
    this.cache = {}
    this.pollingRateSeconds = pollingRateSeconds || 300
    this.serializeSegments = serializeSegments || false
    this.splitioApiBinding = splitioApiBinding
    this.interval = null
  }

  async pollForChanges () {
    try {
      const splitChanges = await this.splitioApiBinding.getSplitChanges()
      Object.assign(this.cache, splitChanges)
      if (this.serializeSegments) {
        const segmentChanges = await this.splitioApiBinding.getSegmentChanges()
        Object.assign(this.cache, segmentChanges)
      }
    } catch (err) {
      this.emit('error', err)
    }
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
