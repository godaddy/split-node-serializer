'use strict'

const { expect } = require('chai')
const nock = require('nock')
const sinon = require('sinon')

const SplitioApiBinding = require('./splitio-api-binding')

const MOCK_SPLITIO_API_URI = 'https://mock-sdk.split.io/api'
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
        .reply(200, 'Success!')

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
      } catch (err) {
        expect(err.statusCode).equals(401)
        expect(err.message).equals('Unauthorized')
      }
    })

    it('throws an error when no response is received', async () => {
      nock(MOCK_SPLITIO_API_URI)
        .get('/mock')
        .query({
          since: -1
        })
        .replyWithError('Error')

      try {
        await splitioApiMock.httpGet({
          path: 'mock',
          since: -1
        })
        throw new Error('did not throw')
      } catch (err) {
        expect(err).to.be.an.instanceof(Error)
      }
    })
  })

  describe('getSplitChanges', () => {
    const mockSplits0 = { status: 'bar' }
    const mockSplits1 = { status: 'baz' }
    it('returns all splits and the since value', async () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      const requestStub = sinon.stub()
      splitioApiBinding.httpGet = requestStub
      requestStub.onCall(0).resolves({
        splits: [
          mockSplits0,
          mockSplits1
        ],
        since: 1
      })
      const splitChanges = await splitioApiBinding.getSplitChanges({ path: '/splitChanges' })
      expect(splitChanges).deep.equals({
        splitChanges: [
          mockSplits0,
          mockSplits1
        ],
        since: 1
      })
    })

    it('throws an error on an error from getAllChanges', async () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      const requestStub = sinon.stub()
      splitioApiBinding.httpGet = requestStub
      requestStub.onCall(0).rejects('Some Error')
      try {
        await splitioApiBinding.getSplitChanges()
        throw new Error('did not throw')
      } catch (err) {
        expect(err).to.be.an.instanceof(Error)
      }
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
