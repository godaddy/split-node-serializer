'use strict'

const SplitioApiBinding = require('./splitio-api-binding')

class DataSerializer {
  constructor ({
    splitioApiKey,
    pollingRate,
    serializeSegments
  }) {
    this._splitioApiBinding = new SplitioApiBinding({
      splitioApiKey,
      pollingRate,
      serializeSegments
    })
  }

  /**
   * Serialize split and segment data into strings.
   */
  getSerializedData () {
    throw new Error('Not implemented')
  }
}

module.exports = DataSerializer
