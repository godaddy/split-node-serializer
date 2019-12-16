'use strict'

const { expect } = require('chai')

const DataSerializer = require('./data-serializer')

describe('lib.data-serializer.DataSerializer', () => {
  describe('generateSerializedDataScript', () => {
    it('adds split and segment data to window.__splitCachePreload', () => {
      const mockSplitsObject = {
        'split-1-name': { name: 'split-1-name', status: 'bar' },
        'split-2-name': { name: 'split-2-name', status: 'baz' }
      }
      const mockSegmentsObject = {
        'test-segment': { name: 'test-segment', added: ['foo', 'bar'] }
      }
      const dataSerializer = new DataSerializer({
        splitioApiKey: 'foo',
        poller: {
          cache: {
            splits: mockSplitsObject,
            since: 1,
            segments: mockSegmentsObject,
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
          splitsData: mockSplitsObject,
          since: 1,
          segmentsData: mockSegmentsObject,
          usingSegmentsCount: 2
        }
      })
    })
  })
})
