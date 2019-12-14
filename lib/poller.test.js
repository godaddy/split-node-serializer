'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const Poller = require('./poller')

describe('lib.poller.Poller', () => {
  let poller
  const mockSplitChanges = {
    splitChanges: [
      { status: 'bar' },
      { status: 'baz' }
    ],
    since: 1
  }
  const mockSegmentChanges = {
    segmentChanges: [
      { name: 'zoo' }
    ]
  }
  beforeEach(() => {
    poller = new Poller({
      pollingRateSeconds: 0.1,
      splitioApi: {
        getSplitChanges: () => {
          return mockSplitChanges
        },
        getSegmentChanges: () => {
          return mockSegmentChanges
        }
      }
    })
  })
  describe('pollForChanges', () => {
    it('polls the Split.io API periodically to get split and segment data and saves to the local cache', async () => {
      poller.serializeSegments = true
      expect(poller.cache).deep.equals({})
      await poller.pollForChanges()
      expect(poller.cache).deep.equals(
        Object.assign(mockSplitChanges, mockSegmentChanges))
    })

    it('only polls the Split.io API to get split data when serializeSegments is false and saves it to the local cache', async () => {
      poller.splitioApi = {
        getSplitChanges: () => {
          return mockSplitChanges
        }
      }
      expect(poller.cache).deep.equals({})
      await poller.pollForChanges()
      expect(poller.cache).deep.equals(mockSplitChanges)
    })

    it('updates the local cache with the latest split data', async () => {
      poller.serializeSegments = true
      poller.cache = {
        splitChanges: [
          { status: 'bar' }
        ],
        since: 0,
        segmentChanges: [
        ]
      }
      await poller.pollForChanges()
      expect(poller.cache).deep.equals(
        Object.assign(mockSplitChanges, mockSegmentChanges))
    })

    it('logs on an error from fetching split and segment data', async () => {
      poller.serializeSegments = true
      const splitsError = new Error('Error getting splits')
      const segmentsError = new Error('Error getting segments')
      poller.splitioApi = {
        getSplitChanges: () => {
          throw splitsError
        },
        getSegmentChanges: () => {
          throw segmentsError
        }
      }
      const log = sinon.spy(console, 'log')
      await poller.pollForChanges()
      expect(log.calledTwice).equals(true)
      expect(log.calledWith('Error getting split changes', splitsError)).equals(true)
      expect(log.calledWith('Error getting segment changes', segmentsError))
      expect(poller.cache).deep.equals({})
    })
  })

  describe('poll', () => {
    it('calls setInterval to poll for changes after pollingRateSeconds and returns an interval that can be used to stop polling', async () => {
      const pollForChanges = sinon.spy(poller, 'pollForChanges')
      const interval = poller.poll()
      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(interval._called).equals(true)
      expect(pollForChanges.called).equals(true)
    })
  })

  describe('stop', () => {
    it('clears an interval and stops polling', () => {
      const interval = setInterval(() => { }, 100)
      expect(interval._idleTimeout).equals(100)
      poller.stop({ interval })
      expect(interval._idleTimeout).equals(-1)
    })
  })
})
