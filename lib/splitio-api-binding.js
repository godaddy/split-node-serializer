'use strict'

const https = require('https')

const axios = require('axios')

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
        throw new Error(
          `Unexpected HTTP code: ${err.response.status}, ${err.response.data}`)
      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        throw new Error('No response received')
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Error: ${err.message}`)
      }
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
