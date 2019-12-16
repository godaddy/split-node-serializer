'use strict'

const fs = require('fs')
const path = require('path')

const { expect } = require('chai')

const DataSerializer = require('./data-serializer')

describe('lib.data-serializer.DataSerializer', () => {
  describe('generateSerializedDataScript', () => {
    it('returns a script with serialized data', () => {
      const dataSerializer = new DataSerializer({
        splitioApiKey: 'foo',
        poller: {
          cache: {
            splitChanges: [{ status: 'bar'}, { status: 'baz'}],
            since: 1,
            segmentChanges: [{ name: 'test-segment', added: ['foo', 'bar'] }],
            usingSegmentsCount: 2
          }
        }
      })
      // eslint-disable-next-line no-sync
      const expectedScript = fs.readFileSync(path.resolve(__dirname, './data.test/expected-script.html')).toString()
      console.log(expectedScript)
      const res = dataSerializer.generateSerializedDataScript()
      expect(res).to.equal(expectedScript)
    })
  })
})
