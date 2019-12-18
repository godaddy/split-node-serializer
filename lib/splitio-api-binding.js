'use strict'

const https = require('https')

const axios = require('axios')

const SPLITIO_API_URI = 'https://sdk.split.io/api'
const SINCE_VALUE_FOR_FIRST_REQUEST = -1
const DEFAULT_MAX_NUM_REQUESTS = 100

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
   * @param {String} path - The path of the HTTP request.
   * @param {Integer} maxNumRequests - The maximum number of API requests to make
   */
  async getAllChanges ({ path, maxNumRequests = DEFAULT_MAX_NUM_REQUESTS }) {
    let since = SINCE_VALUE_FOR_FIRST_REQUEST
    let requestCount = 0
    const allChanges = []
    while (requestCount < maxNumRequests) {
      const results = await this.httpGet({ path, since })
      if (since === results.till) {
        break
      }
      allChanges.push(results)
      since = results.till
      requestCount++
    }
    return { allChanges, since }
  }

  /**
   * Get split data.
   */
  async getSplits () {
    const path = '/splitChanges'
    const splits = {}
    const { allChanges, since } = await this.getAllChanges({ path })
    allChanges.forEach(change => {
      change.splits.forEach(split => {
        if (split.status === 'ARCHIVED') {
          delete splits[split.name]
        } else {
          splits[split.name] = split
        }
      })
    })
    return { splits, since }
  }

  /**
   * Get segment data.
   */
  async getSegments ({ splits }) {
    const allSegmentNames = []
    const segments = {}
    let usingSegmentsCount = 0
    Object.values(splits).forEach(split => {
      const segmentNames = getSegmentNamesInUse({
        splitConditions: split.conditions
      })
      if (segmentNames.size) {
        usingSegmentsCount++
      }
      segmentNames.forEach(segmentName => {
        if (!allSegmentNames.includes(segmentName)) {
          allSegmentNames.push(segmentName)
        }
      })
    })
    const promises = allSegmentNames.map(async segmentName => {
      const path = `/segmentChanges/${segmentName}`
      const { allChanges } = await this.getAllChanges({ path })
      allChanges.forEach(change => {
        if (segments[change.name]) {
          segments[change.name].added.push(...change.added)
          for (var i = 0; i < segments[change.name].added.length; i++) {
            if (change.removed.includes(segments[change.name].added[i])) {
              segments[change.name].added.splice(i, 1)
            }
          }
        } else {
          segments[change.name] = {
            name: change.name,
            added: change.added
          }
        }
      })
    })

    await Promise.all(promises)
    return { segments, usingSegmentsCount }
  }
}

function getSegmentNamesInUse ({ splitConditions }) {
  const segmentNames = new Set()

  splitConditions.forEach(splitCondition => {
    splitCondition.matcherGroup.matchers.forEach(matcher => {
      if (matcher.matcherType === 'IN_SEGMENT') {
        segmentNames.add(matcher.userDefinedSegmentMatcherData.segmentName)
      }
    })
  })

  return segmentNames
}

module.exports = {
  getSegmentNamesInUse,
  SplitioApiBinding
}
