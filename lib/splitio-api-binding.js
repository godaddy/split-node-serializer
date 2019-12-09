'use strict'

class SplitioApiBinding {
  constructor ({ splitioApiKey, pollingRate, serializeSegments }) {
    this.splitioApiKey = splitioApiKey
    this.pollingRate = pollingRate || 300
    this.serializeSegments = serializeSegments || false
  }

  /**
   * Make a GET request to the Split.io SDK API.
   */
  httpGet () {
    throw new Error('Not implemented')
  }

  /**
   * Get split data.
   */
  getSplitChanges () {
    throw new Error('Not implemented')
  }

  /**
   * Get segment data.
   */
  getSegmentChanges () {
    throw new Error('Not implemented')
  }
}

module.exports = SplitioApiBinding
