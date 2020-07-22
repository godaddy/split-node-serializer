'use strict'

const { expect } = require('chai')

const DataSerializer = require('./data-serializer')

describe('lib.data-serializer.DataSerializer', () => {
  describe('generateSerializedDataScript', () => {
    it('returns script with cached serializedData', async () => {
      const dataSerializer = new DataSerializer({
        poller: {
          cache: {
            serializedData: '{"splitsData":{"split-1-name":"{\\"name\\":\\"split-1-name\\",\\"status\\":\\"bar\\"}","split-2-name":"{\\"name\\":\\"split-2-name\\",\\"status\\":\\"baz\\"}"},"since":1,"segmentsData":{"test-segment":"{\\"name\\":\\"test-segment\\",\\"added\\":[\\"foo\\",\\"bar\\"]}"},"usingSegmentsCount":2}'
          }
        }
      })
      const res = await dataSerializer.generateSerializedDataScript()
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
    it('returns script with cached serializedData when there is a splits argument', async () => {
      const dataSerializer = new DataSerializer({
        poller: {
          cache: {
            serializedData: '{"splitsData":{"split-1-name":"{\\"name\\":\\"split-1-name\\",\\"status\\":\\"bar\\"}","split-2-name":"{\\"name\\":\\"split-2-name\\",\\"status\\":\\"baz\\"}"},"since":1,"segmentsData":{"test-segment":"{\\"name\\":\\"test-segment\\",\\"added\\":[\\"foo\\",\\"bar\\"]}"},"usingSegmentsCount":2}'
          },
          getSerializedDataSubset: () => '{"splitsData":{"split-1-name":"{\\"name\\":\\"split-1-name\\",\\"status\\":\\"bar\\"}"},"since":1,"segmentsData":{"test-segment":"{\\"name\\":\\"test-segment\\",\\"added\\":[\\"foo\\",\\"bar\\"]}"},"usingSegmentsCount":2}'
        }
      })
      const res = await dataSerializer.generateSerializedDataScript(['split-1-name'])
      const window = {}
      // eslint-disable-next-line no-eval
      eval(res.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({
        __splitCachePreload: {
          splitsData: {
            'split-1-name': '{"name":"split-1-name","status":"bar"}'
          },
          since: 1,
          segmentsData: {
            'test-segment': '{"name":"test-segment","added":["foo","bar"]}'
          },
          usingSegmentsCount: 2
        }
      })
    })
    it('handles empty serializedData in poller cache', async () => {
      const dataSerializer = new DataSerializer({
        poller: {
          cache: {}
        }
      })
      const res = await dataSerializer.generateSerializedDataScript()
      const window = {}
      // eslint-disable-next-line no-eval
      eval(res.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({ __splitCachePreload: {} })
    })
    it('handles empty serializedData in poller cache when there is a splits argument', async () => {
      const dataSerializer = new DataSerializer({
        poller: {
          cache: {},
          getSerializedDataSubset: () => '{}'
        }
      })
      const res = await dataSerializer.generateSerializedDataScript(['foo'])
      const window = {}
      // eslint-disable-next-line no-eval
      eval(res.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({ __splitCachePreload: {} })
    });
    it('can handle alternative preloadLocations', async () => {
      const dataSerializer = new DataSerializer({
        poller: {
          cache: {
            serializedData: '{"splitsData":{"split-1-name":"{\\"name\\":\\"split-1-name\\",\\"status\\":\\"bar\\"}","split-2-name":"{\\"name\\":\\"split-2-name\\",\\"status\\":\\"baz\\"}"},"since":1,"segmentsData":{"test-segment":"{\\"name\\":\\"test-segment\\",\\"added\\":[\\"foo\\",\\"bar\\"]}"},"usingSegmentsCount":2}'
          }
        }
      })
      const res = await dataSerializer.generateSerializedDataScript([], '__customLocation')
      const window = {}
      // eslint-disable-next-line no-eval
      eval(res.replace('<script>', '').replace('</script>', ''))
      expect(window).to.deep.equal({
        __customLocation: {
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
  })
})
