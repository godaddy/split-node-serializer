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
      expect(poller.cache).deep.equals({})
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
      expect(poller.cache).deep.equals({})
      await poller.pollForChanges()
      expect(poller.cache).deep.equals(mockGetSplitsResult)
    })

    it('updates the local cache with the latest split data', async () => {
      poller.serializeSegments = true
      poller.cache = {
        splits: { mockSplit0: { name: 'mockSplit0', status: 'foo' } },
        since: 0,
        segments: {}
      }
      await poller.pollForChanges()
      expect(poller.cache).deep.equals(
        Object.assign(mockGetSplitsResult, mockGetSegmentsResult))
    })

    it('updates the cached data script', async () => {
      poller.serializeSegments = true
      poller.cache = {
        splits: { mockSplit0: { name: 'mockSplit0', status: 'foo' } },
        since: 0,
        segments: {}
      }
      await poller.pollForChanges()
      const window = {}
      // eslint-disable-next-line no-eval
      eval(poller.cachedSerializedDataScript.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({
        __splitCachePreload: {
          splitsData: {
            mockSplit0: '{"status":"bar"}',
            mockSplit1: '{"status":"baz"}'
          },
          since: 1,
          segmentsData: {
            mockSegment0: '{"name":"mockSegment0","added":[]}'
          },
          usingSegmentsCount: 1
        }
      })
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
        expect(poller.cache).deep.equals({})
      }
    })
  })

  describe('getCachedSerializedDataScript', () => {
    it('adds split and segment data to window.__splitCachePreload', async () => {
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
        usingSegmentsCount: 2
      }
      const res = await poller.getCachedSerializedDataScript()
      const window = {}
      // eslint-disable-next-line no-eval
      eval(res.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({
        __splitCachePreload: {
          splitsData: {
            'split-1-name': '{"name":"split-1-name","status":"bar"}',
            'split-2-name': '{"name":"split-2-name","status":"baz"}'
          },
          since: 1,
          segmentsData: {
            'test-segment': '{"name":"test-segment","added":["foo","bar"]}'
          },
          usingSegmentsCount: 2
        }
      })
    })

    it('handles empty caches', async () => {
      poller.serializeSegments = true
      const res = await poller.getCachedSerializedDataScript()
      const window = {}
      // eslint-disable-next-line no-eval
      eval(res.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({ __splitCachePreload: {} })
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
})
