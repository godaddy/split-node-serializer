'use strict'

class DataSerializer {
  constructor ({ poller }) {
    this.poller = poller
  }

  /**
   * Get latest split and segment data and return a script containing serialized strings.
   */
  generateSerializedDataScript (splits = []) {
    const serializedData = splits.length > 0
      ? this._getSomeSerializedData(splits)
      : this._getAllSerializedData()

    return `<script>
      window.__splitCachePreload = ${serializedData};
    </script>`
  }

  _getSomeSerializedData (splits) {
    const key = splits.sort().join('.')
    if (this.poller.cache.serializedDataSubsets[key]) {
      return this.poller.cache.serializedDataSubsets[key]
    }
    const serializedData = this.poller.generateSerializedData(splits)
    this.poller.cache.serializedDataSubsets[key] = serializedData
    return serializedData
  }

  _getAllSerializedData () {
    return this.poller.cache.serializedData ? this.poller.cache.serializedData : '{}'
  }
}

module.exports = DataSerializer
