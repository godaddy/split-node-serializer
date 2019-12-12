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

  describe('getAllChanges', () => {
    const mockChanges0 = [{ bar: 'bar' }]
    const mockChanges1 = [{ baz: 'baz' }]
    const mockChanges2 = [{ zoo: 'zoo' }]
    it('returns all changes and the since value', async () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      const requestStub = sinon.stub()
      splitioApiBinding.httpGet = requestStub
      requestStub.onCall(0).resolves({ changes: mockChanges0, till: 0 })
      requestStub.onCall(1).resolves({ changes: mockChanges1, till: 1 })
      requestStub.onCall(2).resolves({ changes: mockChanges2, till: 2 })
      requestStub.onCall(3).resolves({ changes: mockChanges2, till: 2 })
      const changes = await splitioApiBinding.getAllChanges({
        path: '/mock',
        maxNumRequests: 10
      })
      expect(changes).deep.equals({
        allChanges: [
          { changes: mockChanges0, till: 0 },
          { changes: mockChanges1, till: 1 },
          { changes: mockChanges2, till: 2 }
        ],
        since: 2
      })
    })

    it('polls until the max number of requests is reached', async () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      const requestStub = sinon.stub()
      splitioApiBinding.httpGet = requestStub
      requestStub.onCall(0).resolves({ changes: mockChanges0, till: 0 })
      requestStub.onCall(1).resolves({ changes: mockChanges1, till: 1 })
      requestStub.onCall(2).resolves({ changes: mockChanges2, till: 2 })
      requestStub.onCall(3).resolves({ changes: mockChanges2, till: 2 })
      const changes = await splitioApiBinding.getAllChanges({
        path: '/mock',
        maxNumRequests: 2
      })
      expect(changes).deep.equals({
        allChanges: [
          { changes: mockChanges0, till: 0 },
          { changes: mockChanges1, till: 1 }
        ],
        since: 1
      })
    })

    it('throws an error on an error from httpGet', async () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      const requestStub = sinon.stub()
      splitioApiBinding.httpGet = requestStub
      requestStub.onCall(0).resolves({ changes: mockChanges0, till: 0 })
      requestStub.onCall(1).rejects('Some Error')
      try {
        await splitioApiBinding.getAllChanges({ path: '/mock' })
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
      splitioApiBinding.getAllChanges = requestStub
      requestStub.onCall(0).resolves({
        allChanges: [
          { splits: [mockSplits0], till: 0 },
          { splits: [mockSplits1], till: 1 }
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
      splitioApiBinding.getAllChanges = requestStub
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
