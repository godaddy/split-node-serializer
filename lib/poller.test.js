'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const Poller = require('./poller')

async function delay () {
  await new Promise((resolve) => setTimeout(resolve, 500))
}

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
      // kick off initial poll
      poller.poll()
      poller.pollForChanges()
      await delay()
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
      // kick off initial poll
      poller.poll()
      poller.pollForChanges()
      await delay()
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
      // kick off initial poll
      poller.poll()
      poller.pollForChanges()
      await delay()
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
      const emit = sinon.spy(poller, 'emit')
      // kick off initial poll
      poller.poll()
      poller.pollForChanges()
      await delay()
      expect(emit.calledTwice).equals(true)
      expect(emit.calledWith('error', splitsError)).equals(true)
      expect(emit.calledWith('error', segmentsError))
      expect(poller.cache).deep.equals({})
    })
  })

  describe('poll', () => {
    it('sets this.timeout and emits a poll event after pollingRateSeconds', async () => {
      const emit = sinon.spy(poller, 'emit')
      expect(poller.timeout).equals(null)
      poller.poll()
      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(poller.timeout._called).equals(true)
      expect(emit.called).equals(true)
    })
  })

  describe('stop', () => {
    it('clears an interval and stops polling', () => {
      const timeout = setTimeout(() => { }, 100)
      expect(timeout._idleTimeout).equals(100)
      poller.timeout = timeout
      poller.stop()
      expect(timeout._idleTimeout).equals(-1)
    })
  })
})
