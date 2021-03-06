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
        const error = new Error(err.response.data.message)
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

  async getSegment ({ name }) {
    let added = new Set()
    const path = `/segmentChanges/${name}`
    const { allChanges } = await this.getAllChanges({ path })
    allChanges
      .map(change => ({
        added: new Set(change.added),
        removed: new Set(change.removed)
      }))
      .forEach(change => {
        added = new Set([...added, ...change.added])
        added = new Set([...added].filter(id => !change.removed.has(id)))
      })
    return {
      name,
      added: Array.from(added)
    }
  }

  /**
   * Get segment data.
   */
  async getSegmentsForSplits ({ splits }) {
    let allSegmentNames = new Set()
    const segments = {}
    let usingSegmentsCount = 0

    Object.values(splits).forEach(split => {
      const segmentNames = getSegmentNamesInUse({
        splitConditions: split.conditions
      })
      if (segmentNames.size) {
        usingSegmentsCount++
        allSegmentNames = new Set([...allSegmentNames, ...segmentNames])
      }
    })

    await Promise.all(Array.from(allSegmentNames).map(async segmentName => {
      segments[segmentName] = await this.getSegment({ name: segmentName })
    }))
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
