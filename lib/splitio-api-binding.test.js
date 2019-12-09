'use strict'

const { expect } = require('chai')

const SplitioApiBinding = require('./splitio-api-binding')

describe('lib.splitio-api-binding.SplitioApiBinding', () => {
  describe('httpGet', () => {
    it('should throw a not implemented error', () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      try {
        splitioApiBinding.httpGet()
      } catch (e) {
        return expect(e.message).equals('Not implemented')
      }
      throw new Error('Test did\'t throw')
    })
  })

  describe('getSplitChanges', () => {
    it('should throw a not implemented error', () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      try {
        splitioApiBinding.getSplitChanges()
      } catch (e) {
        return expect(e.message).equals('Not implemented')
      }
      throw new Error('Test did\'t throw')
    })
  })

  describe('getSegmentChanges', () => {
    it('should throw a not implemented error', () => {
      const splitioApiBinding = new SplitioApiBinding({ splitioApiKey: 'foo' })
      try {
        splitioApiBinding.getSegmentChanges()
      } catch (e) {
        return expect(e.message).equals('Not implemented')
      }
      throw new Error('Test did\'t throw')
    })
  })
})
