'use strict'

class Poller {
  constructor ({
    pollingRateSeconds,
    serializeSegments,
    splitioApi
  }) {
    this.cache = {}
    this.pollingRateSeconds = pollingRateSeconds || 300
    this.serializeSegments = serializeSegments || false
    this.splitioApi = splitioApi
    this._stop = false
  }

  async pollForChanges () {
    if (this._stop) return

    try {
      const splitChanges = await this.splitioApi.getSplitChanges()
      Object.assign(this.cache, splitChanges)
    } catch (err) {
      console.log('Error getting split changes', err)
    }
    if (this.serializeSegments) {
      try {
        const segmentChanges = await this.splitioApi.getSegmentChanges()
        Object.assign(this.cache, segmentChanges)
      } catch (err) {
        console.log('Error getting segment changes', err)
      }
    }
  }

  poll () {
    setInterval(() => this.pollForChanges(), this.pollingRateSeconds * 1000)
  }

  stop () {
    this._stop = true
  }
}

module.exports = Poller
