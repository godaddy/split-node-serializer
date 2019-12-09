'use strict'

const https = require('https')

const rp = require('request-promise')

const SPLITIO_API_URI = 'https://sdk.split.io/api/'

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1500
})

class SplitioApiBinding {
  constructor ({
    splitioApiKey,
    splitioApiUri
  }) {
    this.splitioApiKey = splitioApiKey
    this.splitioApiUri = splitioApiUri || SPLITIO_API_URI
  }

  /**
   * Make a GET request to the Split.io SDK API.
   * @param {String} path - The path of the HTTP request.
   * @param {Integer} since - Indicates which changes to fetch
   * (will be -1 on the first request).
   */
  async httpGet ({ path, since }) {
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.splitioApiKey}`
    }

    const requestOptions = {
      uri: `${this.splitioApiUri}${path}`,
      qs: { since },
      headers,
      agent: httpsAgent,
      json: true
    }

    try {
      const response = await rp(requestOptions)
      return response.body
    } catch (e) {
      throw new Error(`HTTP error: ${e.message}`)
    }
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
