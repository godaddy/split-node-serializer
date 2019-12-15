'use strict'

const https = require('https')

const axios = require('axios')

const SPLITIO_API_URI = 'https://sdk.split.io/api'
const SINCE_VALUE_FOR_FIRST_REQUEST = -1

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
    const requestOptions = {
      baseURL: this.splitioApiUri,
      url: path,
      params: { since },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.splitioApiKey}`
      },
      httpsAgent
    }

    try {
      const response = await axios(requestOptions)
      return response.data
    } catch (err) {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const error = new Error(err.response.data)
        error.statusCode = err.response.status
        throw error
      }
      throw err
    }
  }

  /**
   * Get split data.
   */
  async getSplitChanges () {
    const path = '/splitChanges'
    const { splits, since } = await this.httpGet({
      path,
      since: SINCE_VALUE_FOR_FIRST_REQUEST
    })
    return { splitChanges: splits, since }
  }

  /**
   * Get segment data.
   */
  getSegmentChanges () {
    throw new Error('Not implemented')
  }
}

module.exports = SplitioApiBinding
