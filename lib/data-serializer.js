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
    return this.poller.getSerializedDataSubset(splits)
  }

  _getAllSerializedData () {
    return this.poller.cache.serializedData ? this.poller.cache.serializedData : '{}'
  }
}

module.exports = DataSerializer
