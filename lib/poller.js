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
    this._stop = false
  }

  async pollForChanges () {
    if (this._stop) return

    this.on('poll', async () => {
      try {
        const splitChanges = await this.splitioApi.getSplitChanges()
        Object.assign(this.cache, splitChanges)
        this.emit('split data updated', splitChanges)
      } catch (err) {
        this.emit('error getting split changes', err)
      }
      if (this.serializeSegments) {
        try {
          const segmentChanges = await this.splitioApi.getSegmentChanges()
          Object.assign(this.cache, segmentChanges)
          this.emit('segment data updated', segmentChanges)
        } catch (err) {
          this.emit('error getting segment changes', err)
        }
      }
      this.poll()
    })
  }

  poll () {
    setTimeout(() => this.emit('poll'), this.pollingRateSeconds * 1000)
  }

  stop () {
    this._stop = true
  }
}

module.exports = Poller
