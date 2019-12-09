'use strict'

const { expect } = require('chai')
const nock = require('nock')

const SplitioApiBinding = require('./splitio-api-binding')

const MOCK_SPLITIO_API_URI = 'https://mock-sdk.split.io/api/'
const MOCK_SPLITIO_API_KEY = 'mock-key'

describe('lib.splitio-api-binding.SplitioApiBinding', () => {
  let splitioApiMock
  beforeEach(() => {
    splitioApiMock = new SplitioApiBinding({
      splitioApiUri: MOCK_SPLITIO_API_URI,
      splitioApiKey: MOCK_SPLITIO_API_KEY
    })
  })

  describe('httpGet', () => {
    it('returns a successful response', async () => {
      nock(MOCK_SPLITIO_API_URI)
        .get('/mock')
        .query({
          since: -1
        })
        .reply(200, { body: 'Success!' })

      const results = await splitioApiMock.httpGet({
        path: 'mock',
        since: -1
      })

      expect(results).equals('Success!')
    })

    it('throws an error on a non-200 response', async () => {
      nock(MOCK_SPLITIO_API_URI)
        .get('/mock')
        .query({
          since: -1
        })
        .reply(401, 'Unauthorized')

      try {
        await splitioApiMock.httpGet({
          path: 'mock',
          since: -1
        })
        throw new Error('did not throw')
      } catch (e) {
        expect(e.message).equals('HTTP error: 401 - "Unauthorized"')
      }
    })
  })

  describe('getSplitChanges', () => {
    it('should throw a not implemented error', () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      try {
        splitioApiBinding.getSplitChanges()
      } catch (e) {
        return expect(e.message).equals('Not implemented')
      }
      throw new Error('Test did\'t throw')
    })
  })

  describe('getSegmentChanges', () => {
    it('should throw a not implemented error', () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      try {
        splitioApiBinding.getSegmentChanges()
      } catch (e) {
        return expect(e.message).equals('Not implemented')
      }
      throw new Error('Test did\'t throw')
    })
  })
})
