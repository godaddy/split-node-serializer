'use strict'

const SplitioApiBinding = require('./splitio-api-binding')

class DataSerializer {
  constructor ({
    splitioApiKey,
    pollingRateSeconds,
    serializeSegments
  }) {
    this._splitioApiBinding = new SplitioApiBinding({ splitioApiKey })
    this.pollingRateSeconds = pollingRateSeconds || 300
    this.serializeSegments = serializeSegments || false
  }

  /**
   * Serialize split and segment data into strings.
   */
  getSerializedData () {
    throw new Error('Not implemented')
  }
}

module.exports = DataSerializer
