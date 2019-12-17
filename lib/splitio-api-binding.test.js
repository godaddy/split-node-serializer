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

  describe('getSplits', () => {
    const mockSplit0 = { name: 'mockSplit0', status: 'bar' }
    const mockSplit1 = { name: 'mockSplit1', status: 'baz' }
    const mockSplit2 = { name: 'mockSplit2', status: 'ARCHIVED' }
    it('returns all active splits and the since value', async () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      const requestStub = sinon.stub()
      splitioApiBinding.getAllChanges = requestStub
      requestStub.onCall(0).resolves({
        allChanges: [
          { splits: [mockSplit0], till: 0 },
          { splits: [mockSplit1, mockSplit2], till: 1 }
        ],
        since: 1
      })
      const splits = await splitioApiBinding.getSplits({ path: '/splitChanges' })
      expect(splits).deep.equals({
        splits: {
          mockSplit0,
          mockSplit1
        },
        since: 1
      })
    })

    it('throws an error on an error from getAllChanges', async () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      const requestStub = sinon.stub()
      splitioApiBinding.getAllChanges = requestStub
      requestStub.onCall(0).rejects('Some Error')
      try {
        await splitioApiBinding.getSplits()
        throw new Error('did not throw')
      } catch (err) {
        expect(err).to.be.an.instanceof(Error)
      }
    })
  })

  describe('getSegments', () => {
    it('should throw a not implemented error', () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      try {
        splitioApiBinding.getSegments()
      } catch (e) {
        return expect(e.message).equals('Not implemented')
      }
      throw new Error('Test did\'t throw')
    })
  })
})
