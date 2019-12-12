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
   * Polls the Split.io API until since and till timestamps are the same.
   */
  async getAllChanges ({ path }) {
    let since = SINCE_VALUE_FOR_FIRST_REQUEST
    let results = await this.httpGet({ path, since })
    const allChanges = [results]
    // The till value represents the timestamp of the last change included in the response.
    let till = results.till
    while (since !== till) {
      since = till
      results = await this.httpGet({ path, since })
      till = results.till
      if (since === till) {
        return { allChanges, since }
      }
      allChanges.push(results)
    }
    return { allChanges, since }
  }

  /**
   * Get split data.
   */
  async getSplitChanges () {
    const path = '/splitChanges'
    const splitChanges = []
    const { allChanges, since } = await this.getAllChanges({ path })
    allChanges.forEach(change => {
      change.splits.forEach(split => {
        splitChanges.push(split)
      })
    })
    return { splitChanges, since }
  }

  /**
   * Get segment data.
   */
  getSegmentChanges () {
    throw new Error('Not implemented')
  }
}

module.exports = SplitioApiBinding
