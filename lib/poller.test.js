'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const Poller = require('./poller')

describe('lib.poller.Poller', () => {
  let poller
  const mockGetSplitsResult = {
    splits: {
      mockSplit0: { status: 'bar' },
      mockSplit1: { status: 'baz' }
    },
    since: 1
  }
  const mockGetSegmentsResult = {
    segments: {
      mockSegment0: { name: 'mockSegment0', added: [] }
    },
    usingSegmentsCount: 1
  }
  beforeEach(() => {
    poller = new Poller({
      pollingRateSeconds: 0.1,
      splitioApiBinding: {
        getSplits: () => {
          return mockGetSplitsResult
        },
        getSegmentsForSplits: () => {
          return mockGetSegmentsResult
        }
      }
    })
  })
  describe('pollForChanges', () => {
    it('polls the Split.io API periodically to get split and segment data and saves to the local cache', async () => {
      poller.serializeSegments = true
      expect(poller.cache).deep.equals({ serializedDataSubsets: {} })
      await poller.pollForChanges()
      expect(poller.cache.since).equals(mockGetSplitsResult.since)
      expect(poller.cache.splits).deep.equals(mockGetSplitsResult.splits)
      expect(poller.cache.segments).deep.equals(mockGetSegmentsResult.segments)
      expect(poller.cache.usingSegmentsCount).deep.equals(mockGetSegmentsResult.usingSegmentsCount)
    })

    it('only polls the Split.io API to get split data when serializeSegments is false and saves it to the local cache', async () => {
      poller.splitioApiBinding = {
        getSplits: () => {
          return mockGetSplitsResult
        }
      }
      expect(poller.cache).deep.equals({ serializedDataSubsets: {} })
      await poller.pollForChanges()
      expect(poller.cache).deep.equals(
        Object.assign(mockGetSplitsResult,
          // eslint-disable-next-line
          { serializedData: '{"splitsData":{"mockSplit0":"{\\"status\\":\\"bar\\"}","mockSplit1":"{\\"status\\":\\"baz\\"}"},"since":1}' },
          { serializedDataSubsets: {} }
        )
      )
    })

    it('updates the local cache with the latest split data', async () => {
      poller.serializeSegments = true
      poller.cache = {
        splits: { mockSplit0: { name: 'mockSplit0', status: 'foo' } },
        since: 0,
        segments: {},
        serializedDataSubsets: { mockSplit0: 'old-cache-data' }
      }
      await poller.pollForChanges()
      expect(poller.cache).deep.equals(
        Object.assign(mockGetSplitsResult, mockGetSegmentsResult,
          // eslint-disable-next-line
          { serializedData: '{"splitsData":{"mockSplit0":"{\\"status\\":\\"bar\\"}","mockSplit1":"{\\"status\\":\\"baz\\"}"},"since":1,"segmentsData":{"mockSegment0":"{\\"name\\":\\"mockSegment0\\",\\"added\\":[]}"},"usingSegmentsCount":1}' },
          { serializedDataSubsets: { mockSplit0: '{"splitsData":{"mockSplit0":"{\\"status\\":\\"bar\\"}"},"since":1,"segmentsData":{"mockSegment0":"{\\"name\\":\\"mockSegment0\\",\\"added\\":[]}"},"usingSegmentsCount":1}' } }
        )
      )
    })

    it('updates the cached serializedData', async () => {
      poller.serializeSegments = true
      poller.cache = {
        splits: { mockSplit0: { name: 'mockSplit0', status: 'foo' } },
        since: 0,
        segments: {},
        serializedDataSubsets: {}
      }
      poller.cache.serializedData = 'something-that-should-change'
      await poller.pollForChanges()
      expect(poller.cache.serializedData).to.equal('{"splitsData":{"mockSplit0":"{\\"status\\":\\"bar\\"}","mockSplit1":"{\\"status\\":\\"baz\\"}"},"since":1,"segmentsData":{"mockSegment0":"{\\"name\\":\\"mockSegment0\\",\\"added\\":[]}"},"usingSegmentsCount":1}')
    })

    it('updates the cached serializedDataSubsets', async () => {
      poller.serializeSegments = true
      poller.cache = {
        splits: { mockSplit0: { name: 'mockSplit0', status: 'foo' } },
        since: 0,
        segments: {},
        serializedDataSubsets: { 'mockSplit0.mockSplit1': 'old-cache-data' }
      }
      poller.cache.serializedData = 'something-that-should-change'
      await poller.pollForChanges()
      expect(poller.cache.serializedDataSubsets).to.deep.equal({ 'mockSplit0.mockSplit1': '{"splitsData":{"mockSplit0":"{\\"status\\":\\"bar\\"}","mockSplit1":"{\\"status\\":\\"baz\\"}"},"since":1,"segmentsData":{"mockSegment0":"{\\"name\\":\\"mockSegment0\\",\\"added\\":[]}"},"usingSegmentsCount":1}' })
    })

    it('emits an error from fetching split and segment data', async () => {
      poller.serializeSegments = true
      const splitsError = new Error('Error getting splits')
      const segmentsError = new Error('Error getting segments')
      poller.splitioApiBinding = {
        getSplits: () => {
          throw splitsError
        },
        getSegmentsForSplits: () => {
          throw segmentsError
        }
      }
      const emit = sinon.spy(poller, 'emit')
      try {
        await poller.pollForChanges()
        throw new Error('did not throw')
      } catch (err) {
        expect(emit.calledOnce).equals(true)
        expect(emit.calledWith('error', splitsError)).equals(true)
        expect(poller.cache).deep.equals({ serializedDataSubsets: {} })
      }
    })
  })

  describe('start', () => {
    it('awaits the first call to pollForChanges and then kicks of the periodic poll function', async () => {
      const pollForChanges = sinon.spy(poller, 'pollForChanges')
      const poll = sinon.spy(poller, 'poll')
      await poller.start()
      expect(pollForChanges.calledOnce).equals(true)
      expect(poll.calledOnce).equals(true)
    })
  })

  describe('poll', () => {
    it('sets this.interval and calls pollForChanges after pollingRateSeconds', async () => {
      const pollForChanges = sinon.spy(poller, 'pollForChanges')
      expect(poller.interval).equals(null)
      poller.poll()
      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(pollForChanges.called).equals(true)
    })
  })

  describe('stop', () => {
    it('clears an interval and stops polling', () => {
      const interval = setInterval(() => { }, 100)
      expect(interval._idleTimeout).equals(100)
      poller.interval = interval
      poller.stop()
      expect(interval._idleTimeout).equals(-1)
    })
  })

  describe('getSerializedDataSubset', () => {
    it('returns serializedData when the subset is not cached', async () => {
      poller.cache = {
        splits: { mockSplit0: { name: 'mockSplit0', status: 'foo' } },
        since: 0,
        segments: {},
        serializedDataSubsets: {}
      }
      const res = await poller.getSerializedDataSubset(['mockSplit0'])
      expect(res).to.equal('{"splitsData":{"mockSplit0":"{\\"name\\":\\"mockSplit0\\",\\"status\\":\\"foo\\"}"},"since":0,"segmentsData":{}}')
    })
    it('returns serializedData when the subset is cached', async () => {
      poller.cache = {
        splits: { mockSplit0: { name: 'mockSplit0', status: 'foo' } },
        since: 0,
        segments: {},
        serializedDataSubsets: { mockSplit0: 'cached split' }
      }
      const res = await poller.getSerializedDataSubset(['mockSplit0'])
      expect(res).to.equal('cached split')
    })
  })

  describe('generateSerializedData', () => {
    it('returns stringified split and segment data', async () => {
      const mockSplitsObject = {
        'split-1-name': { name: 'split-1-name', status: 'bar' },
        'split-2-name': { name: 'split-2-name', status: 'baz' }
      }
      const mockSegmentsObject = {
        'test-segment': { name: 'test-segment', added: ['foo', 'bar'] }
      }
      poller.cache = {
        splits: mockSplitsObject,
        since: 1,
        segments: mockSegmentsObject,
        usingSegmentsCount: 2,
        serializedDataSubsets: {}
      }
      const res = await poller.generateSerializedData()
      expect(res).to.equal('{"splitsData":{"split-1-name":"{\\"name\\":\\"split-1-name\\",\\"status\\":\\"bar\\"}","split-2-name":"{\\"name\\":\\"split-2-name\\",\\"status\\":\\"baz\\"}"},"since":1,"segmentsData":{"test-segment":"{\\"name\\":\\"test-segment\\",\\"added\\":[\\"foo\\",\\"bar\\"]}"},"usingSegmentsCount":2}')
    })

    it('returns a subset of stringified split and segment data when given a list of splits', async () => {
      const mockSplitsObject = {
        'split-1-name': { name: 'split-1-name', status: 'bar' },
        'split-2-name': { name: 'split-2-name', status: 'baz' }
      }
      const mockSegmentsObject = {
        'test-segment': { name: 'test-segment', added: ['foo', 'bar'] }
      }
      poller.cache = {
        splits: mockSplitsObject,
        since: 1,
        segments: mockSegmentsObject,
        usingSegmentsCount: 2,
        serializedDataSubsets: {}
      }
      const res = await poller.generateSerializedData(['split-1-name'])
      expect(res).to.equal('{"splitsData":{"split-1-name":"{\\"name\\":\\"split-1-name\\",\\"status\\":\\"bar\\"}"},"since":1,"segmentsData":{"test-segment":"{\\"name\\":\\"test-segment\\",\\"added\\":[\\"foo\\",\\"bar\\"]}"},"usingSegmentsCount":2}')
    })

    it('returns a subset of stringified split data and segments data from the mocked getSegmentsForSplits response', async () => {
      poller.serializeSegments = true
      const mockSplitsObject = {
        'split-1-name': { name: 'split-1-name', status: 'bar' },
        'split-2-name': { name: 'split-2-name', status: 'baz' }
      }
      const mockSegmentsObject = {
        'test-segment': { name: 'test-segment', added: ['foo', 'bar'] }
      }
      poller.cache = {
        splits: mockSplitsObject,
        since: 1,
        segments: mockSegmentsObject,
        usingSegmentsCount: 2,
        serializedDataSubsets: {}
      }
      const cacheBefore = JSON.parse(JSON.stringify(poller.cache))

      const res = await poller.generateSerializedData(['split-1-name'])
      expect(res).to.equal('{"splitsData":{"split-1-name":"{\\"name\\":\\"split-1-name\\",\\"status\\":\\"bar\\"}"},"since":1,"segmentsData":{"mockSegment0":"{\\"name\\":\\"mockSegment0\\",\\"added\\":[]}"},"usingSegmentsCount":1}')
      expect(poller.cache).to.deep.equal(cacheBefore)
    })

    it('returns empty segmentsData if error fetching segment data for a subset of splits', async () => {
      poller.serializeSegments = true
      const mockSplitsObject = {
        'split-1-name': { name: 'split-1-name', status: 'bar' },
        'split-2-name': { name: 'split-2-name', status: 'baz' }
      }
      const mockSegmentsObject = {
        'test-segment': { name: 'test-segment', added: ['foo', 'bar'] }
      }
      poller.cache = {
        splits: mockSplitsObject,
        since: 1,
        segments: mockSegmentsObject,
        usingSegmentsCount: 2,
        serializedDataSubsets: {}
      }
      const segmentsError = new Error('Error getting segments')
      poller.splitioApiBinding = {
        getSegmentsForSplits: () => {
          throw segmentsError
        }
      }

      const res = await poller.generateSerializedData(['split-1-name'])
      expect(res).to.equal('{"splitsData":{"split-1-name":"{\\"name\\":\\"split-1-name\\",\\"status\\":\\"bar\\"}"},"since":1,"segmentsData":{},"usingSegmentsCount":0}')
    })

    it('handles empty caches', async () => {
      const res = await poller.generateSerializedData()
      expect(res).to.equal('{}')
    })

    it('handles empty caches with splits', async () => {
      const res = await poller.generateSerializedData(['foo'])
      expect(res).to.equal('{}')
    })
  })
})
