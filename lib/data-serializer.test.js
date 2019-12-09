'use strict'

const { expect } = require('chai')

const DataSerializer = require('./data-serializer')

describe('lib.data-serializer.DataSerializer', () => {
  describe('getSerializedData', () => {
    it('should throw a not implemented error', () => {
      const dataSerializer = new DataSerializer({ splitioApiKey: 'foo' })
      try {
        dataSerializer.getSerializedData()
      } catch (e) {
        return expect(e.message).equals('Not implemented')
      }
      throw new Error('Test did\'t throw')
    })
  })
})
