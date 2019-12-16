'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const Poller = require('./poller')

describe('lib.poller.Poller', () => {
  let poller
  const mockSplits = {
    splits: {
      mockSplit0: { status: 'bar' },
      mockSplit1: { status: 'baz' }
    },
    since: 1
  }
  const mockSegments = {
    segments: {
      mockSegment0: { name: 'mockSegment0', added: [] }
    }
  }
  beforeEach(() => {
    poller = new Poller({
      pollingRateSeconds: 0.1,
      splitioApiBinding: {
        getSplits: () => {
          return mockSplits
        },
        getSegments: () => {
          return mockSegments
        }
      }
    })
  })
  describe('pollForChanges', () => {
    it('polls the Split.io API periodically to get split and segment data and saves to the local cache', async () => {
      poller.serializeSegments = true
      expect(poller.cache).deep.equals({})
      await poller.pollForChanges()
      expect(poller.cache.since).equals(mockSplits.since)
      expect(poller.cache.splits).deep.equals(mockSplits.splits)
      expect(poller.cache.segments).deep.equals(mockSegments.segments)
    })

    it('only polls the Split.io API to get split data when serializeSegments is false and saves it to the local cache', async () => {
      poller.splitioApiBinding = {
        getSplits: () => {
          return mockSplits
        }
      }
      expect(poller.cache).deep.equals({})
      await poller.pollForChanges()
      expect(poller.cache).deep.equals(mockSplits)
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
        Object.assign(mockSplits, mockSegments))
    })

    it('emits an error from fetching split and segment data', async () => {
      poller.serializeSegments = true
      const splitsError = new Error('Error getting splits')
      const segmentsError = new Error('Error getting segments')
      poller.splitioApiBinding = {
        getSplits: () => {
          throw splitsError
        },
        getSegments: () => {
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
