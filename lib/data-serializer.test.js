'use strict'

const { expect } = require('chai')

const DataSerializer = require('./data-serializer')

describe('lib.data-serializer.DataSerializer', () => {
  describe('generateSerializedDataScript', () => {
    it('returns cachedSerializedDataScript', () => {
      const dataSerializer = new DataSerializer({
        poller: {
          cachedSerializedDataScript: `<script>
            window.__splitCachePreload = {
              "splitsData": {
                'split-1-name': '{"name":"split-1-name","status":"bar"}',
                'split-2-name': '{"name":"split-2-name","status":"baz"}'
              },
              "since": 1,
              "segmentsData": {
                'test-segment': '{"name":"test-segment","added":["foo","bar"]}'
              },
              "usingSegmentsCount": 2
            };
          </script>`
        }
      })

      const res = dataSerializer.generateSerializedDataScript()

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
    it('handles empty cachedSerializedDataScript', () => {
      const dataSerializer = new DataSerializer({
        poller: {}
      })

      const res = dataSerializer.generateSerializedDataScript()

      const window = {}
      // eslint-disable-next-line no-eval
      eval(res.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({ __splitCachePreload: {} })
    })
  })
})
