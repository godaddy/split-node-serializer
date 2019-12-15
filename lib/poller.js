'use strict'

const { EventEmitter } = require('events')

class Poller extends EventEmitter {
  constructor ({
    pollingRateSeconds,
    serializeSegments,
    splitioApi
  }) {
    super()
    this.cache = {}
    this.pollingRateSeconds = pollingRateSeconds || 300
    this.serializeSegments = serializeSegments || false
    this.splitioApi = splitioApi
    this.timeout = null
  }

  async pollForChanges () {
    this.on('poll', async () => {
      try {
        const splitChanges = await this.splitioApi.getSplitChanges()
        delete this.cache.splitChanges
        delete this.cache.since
        Object.assign(this.cache, splitChanges)
        console.log(this.cache)
      } catch (err) {
        this.emit('error', err)
      }
      if (this.serializeSegments) {
        try {
          const segmentChanges = await this.splitioApi.getSegmentChanges()
          delete this.cache.segmentChanges
          Object.assign(this.cache, segmentChanges)
        } catch (err) {
          this.emit('error', err)
        }
      }
      this.poll()
    })
  }

  poll () {
    this.timeout = setTimeout(() => this.emit('poll'), this.pollingRateSeconds * 1000)
  }

  stop () {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }
}

module.exports = Poller
