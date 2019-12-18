'use strict'

const { expect } = require('chai')
const nock = require('nock')
const sinon = require('sinon')

const {
  getSegmentNamesInUse,
  SplitioApiBinding
} = require('./splitio-api-binding')

const MOCK_SPLITIO_API_URI = 'https://mock-sdk.split.io/api'
const MOCK_SPLITIO_API_KEY = 'mock-key'

describe('lib.splitio-api-binding', () => {
  describe('SplitioApiBinding', () => {
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
      const mockSplit1Updated = { name: 'mockSplit1', status: 'zoo' }
      const mockSplit2 = { name: 'mockSplit2', status: 'ARCHIVED' }
      const mockSplit3 = { name: 'mockSplit3', status: 'zaz' }
      const mockSplit3Updated = { name: 'mockSplit3', status: 'ARCHIVED' }
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

      it('overwrites an existing split object with the latest data from a subsequent request', async () => {
        const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
        const requestStub = sinon.stub()
        splitioApiBinding.getAllChanges = requestStub
        requestStub.onCall(0).resolves({
          allChanges: [
            { splits: [mockSplit0, mockSplit1], till: 0 },
            { splits: [mockSplit1Updated, mockSplit3], till: 1 }
          ],
          since: 1
        })
        const splits = await splitioApiBinding.getSplits({ path: '/splitChanges' })
        expect(splits).deep.equals({
          splits: {
            mockSplit0,
            mockSplit1: mockSplit1Updated,
            mockSplit3
          },
          since: 1
        })
      })

      it('does not save a split that was archived after the initial request to GET /splitChanges', async () => {
        const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
        const requestStub = sinon.stub()
        splitioApiBinding.getAllChanges = requestStub
        requestStub.onCall(0).resolves({
          allChanges: [
            { splits: [mockSplit0, mockSplit3], till: 0 },
            { splits: [mockSplit3Updated], till: 1 }
          ],
          since: 1
        })
        const splits = await splitioApiBinding.getSplits({ path: '/splitChanges' })
        expect(splits).deep.equals({
          splits: {
            mockSplit0
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
      it('returns segments data and the count of splits using segments', async () => {
        const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
        const mockSplits = [
          {
            conditions: [
              {
                matcherGroup: {
                  matchers: [
                    {
                      matcherType: 'IN_SEGMENT',
                      userDefinedSegmentMatcherData: {
                        segmentName: 'foo'
                      }
                    }
                  ]
                }
              }
            ]
          },
          {
            conditions: [
              {
                matcherGroup: {
                  matchers: [
                    {
                      matcherType: 'NOT_IN_SEGMENT',
                      userDefinedSegmentMatcherData: {
                        segmentName: 'boo'
                      }
                    }
                  ]
                }
              }
            ]
          },
          {
            conditions: [
              {
                matcherGroup: {
                  matchers: [
                    {
                      matcherType: 'IN_SEGMENT',
                      userDefinedSegmentMatcherData: {
                        segmentName: 'bar'
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
        const requestStub = sinon.stub()
        splitioApiBinding.getAllChanges = requestStub
        requestStub
          .withArgs({ path: '/segmentChanges/foo' })
          .resolves({
            allChanges: [
              { name: 'foo', added: ['foo1', 'foo2'], removed: [] },
              { name: 'foo', added: [], removed: [] }
            ]
          })
        requestStub
          .withArgs({ path: '/segmentChanges/bar' })
          .resolves({
            allChanges: [
              { name: 'bar', added: ['bar1', 'bar2'], removed: [] },
              { name: 'bar', added: [], removed: ['bar2'] }
            ]
          })
        const { segments, usingSegmentsCount } = await splitioApiBinding.getSegments({ splits: mockSplits })
        expect(segments).deep.equals({
          foo: {
            name: 'foo',
            added: ['foo1', 'foo2']
          },
          bar: {
            name: 'bar',
            added: ['bar1']
          }
        })
        expect(usingSegmentsCount).equals(2)
      })
      it('throws an error on an error from getAllChanges', async () => {
        const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
        const requestStub = sinon.stub()
        splitioApiBinding.getAllChanges = requestStub
        requestStub.onCall(0).rejects('Some Error')
        try {
          await splitioApiBinding.getSegments({})
          throw new Error('did not throw')
        } catch (err) {
          expect(err).to.be.an.instanceof(Error)
        }
      })
    })
  })

  describe('getSegmentNamesInUse', () => {
    it('returns the names of any segments in use by splits', () => {
      const splitConditions = [
        {
          conditionType: 'foo',
          matcherGroup: {
            matchers: [
              {
                matcherType: 'WHITELIST',
                userDefinedSegmentMatcherData: null
              }
            ]
          }
        },
        {
          conditionType: 'bar',
          matcherGroup: {
            matchers: [
              {
                matcherType: 'IN_SEGMENT',
                userDefinedSegmentMatcherData: {
                  segmentName: 'test-segment'
                }
              }
            ]
          }
        }
      ]

      const segmentNames = getSegmentNamesInUse({ splitConditions })
      expect(segmentNames.size).equals(1)
      expect(segmentNames.has('test-segment')).equals(true)
    })
  })
})
