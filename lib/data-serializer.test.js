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
            splitChanges: [],
            since: 1,
            segments: [],
            splitsUsingSegments: 2
          }
        }
      })
      // eslint-disable-next-line no-sync
      const expectedScript = fs.readFileSync(path.resolve(__dirname, './data.test/expected-script.html')).toString()
      const res = dataSerializer.generateSerializedDataScript()
      expect(res).to.equal(expectedScript)
    })
  })
})
