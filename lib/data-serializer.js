'use strict'

const Poller = require('./poller')
const SplitioApiBinding = require('./splitio-api-binding')

class DataSerializer {
  constructor ({
    splitioApiKey,
    pollingRateSeconds,
    poller,
    serializeSegments
  }) {
    this.poller = poller || new Poller({
      pollingRateSeconds,
      serializeSegments,
      splitioApi: new SplitioApiBinding({ splitioApiKey })
    })
  }

  /**
   * Get latest split and segment data and serialize into strings.
   */
  getSerializedData () {
    // TODO: read from poller local cache and serialize data
    throw new Error('Not implemented')
  }
}

module.exports = DataSerializer
