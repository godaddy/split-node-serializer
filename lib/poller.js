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
      const { splits, since } = await this.splitioApiBinding.getSplits()
      Object.assign(this.cache, { splits, since })
      if (this.serializeSegments) {
        const segments = await this.splitioApiBinding.getSegments()
        Object.assign(this.cache, segments)
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
