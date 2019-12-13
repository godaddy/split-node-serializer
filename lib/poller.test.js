'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const Poller = require('./poller')

async function delay () {
  await new Promise((resolve) => setTimeout(resolve, 500))
}

describe('lib.poller.Poller', () => {
  let mockSplitioApi, poller
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
      splitioApi: mockSplitioApi
    })
  })
  afterEach(() => {
    poller.stop()
    sinon.restore()
  })
  describe('pollForChanges', () => {
    it('polls the Split.io API periodically to get split and segment data and saves to the local cache', async () => {
      poller.serializeSegments = true
      poller.splitioApi = {
        getSplitChanges: () => {
          return mockSplitChanges
        },
        getSegmentChanges: () => {
          return mockSegmentChanges
        }
      }
      const emit = sinon.spy(poller, 'emit')
      const on = sinon.spy(poller, 'on')
      const poll = sinon.spy(poller, 'poll')
      expect(poller.cache).deep.equals({})
      // kick off initial poll
      poller.poll()
      poller.pollForChanges()
      await delay()
      expect(on.calledOnce).equals(true)
      expect(emit.calledWith('split data updated', mockSplitChanges)).equals(true)
      expect(emit.calledWith('segment data updated', mockSegmentChanges)).equals(true)
      expect(poll.callCount).equals(5)
      expect(poller.cache).deep.equals(
        Object.assign(mockSplitChanges, mockSegmentChanges))
    })

    it('only polls the Split.io API to get split data when serializeSegments is false and saves it to the local cache', async () => {
      poller.splitioApi = {
        getSplitChanges: () => {
          return mockSplitChanges
        }
      }
      const emit = sinon.spy(poller, 'emit')
      const on = sinon.spy(poller, 'on')
      const poll = sinon.spy(poller, 'poll')
      expect(poller.cache).deep.equals({})
      // kick off initial poll
      poller.poll()
      poller.pollForChanges()
      await delay()
      expect(on.calledOnce).equals(true)
      expect(emit.calledWith('split data updated', mockSplitChanges)).equals(true)
      expect(emit.calledWith('segment data updated', mockSegmentChanges)).equals(false)
      expect(poll.callCount).equals(5)
      expect(poller.cache).deep.equals(mockSplitChanges)
    })

    it('updates the local cache with the latest split data', async () => {
      poller.serializeSegments = true
      poller.splitioApi = {
        getSplitChanges: () => {
          return mockSplitChanges
        },
        getSegmentChanges: () => {
          return mockSegmentChanges
        }
      }
      const emit = sinon.spy(poller, 'emit')
      const on = sinon.spy(poller, 'on')
      const poll = sinon.spy(poller, 'poll')
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
      expect(on.calledOnce).equals(true)
      expect(emit.calledWith('split data updated', mockSplitChanges)).equals(true)
      expect(emit.calledWith('segment data updated', mockSegmentChanges)).equals(true)
      expect(poll.callCount).equals(5)
      expect(poller.cache).deep.equals(
        Object.assign(mockSplitChanges, mockSegmentChanges))
    })

    it('emits an event on an error from fetching split and segment data', async () => {
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
      const on = sinon.spy(poller, 'on')
      const poll = sinon.spy(poller, 'poll')
      // kick off initial poll
      poller.poll()
      poller.pollForChanges()
      await delay()
      expect(on.calledOnce).equals(true)
      expect(emit.calledWith('error getting split changes', splitsError)).equals(true)
      expect(emit.calledWith('error getting segment changes', segmentsError)).equals(true)
      expect(poll.callCount).equals(5)
      expect(poller.cache).deep.equals({})
    })

    it('does not poll for changes when Poller._stop is true', async () => {
      poller._stop = true
      const on = sinon.spy(poller, 'on')
      expect(on.notCalled).equals(true)
    })
  })

  describe('poll', () => {
    it('calls setTimeout to emit a poll event after pollingRateSeconds', async () => {
      const emit = sinon.spy(poller, 'emit')
      poller.poll()
      await delay()
      expect(emit.calledOnce).equals(true)
    })
  })

  describe('stop', () => {
    it('sets Poller._stop to true', () => {
      expect(poller._stop).equals(false)
      poller.stop()
      expect(poller._stop).equals(true)
    })
  })
})
