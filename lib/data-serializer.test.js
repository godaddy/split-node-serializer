'use strict'

const { expect } = require('chai')

const DataSerializer = require('./data-serializer')

describe('lib.data-serializer.DataSerializer', () => {
  describe('generateSerializedDataScript', () => {
    it('adds split and segment data to window.__splitCachePreload', () => {
      const dataSerializer = new DataSerializer({
        splitioApiKey: 'foo',
        poller: {
          cache: {
            splitChanges: [{ status: 'bar' }, { status: 'baz' }],
            since: 1,
            segmentChanges: [{ name: 'test-segment', added: ['foo', 'bar'] }],
            usingSegmentsCount: 2
          }
        }
      })
      const res = dataSerializer.generateSerializedDataScript()
      const window = {}
      // eslint-disable-next-line no-eval
      eval(res.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({
        __splitCachePreload: {
          splitsData: [{ status: 'bar' }, { status: 'baz' }],
          since: 1,
          segmentsData: [{ name: 'test-segment', added: ['foo', 'bar'] }],
          usingSegmentsCount: 2
        }
      })
    })
  })
})
