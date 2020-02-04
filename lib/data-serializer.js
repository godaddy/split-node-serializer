'use strict'

class DataSerializer {
  constructor ({ poller }) {
    this.poller = poller
  }

  /**
   * Get latest split and segment data and return a script containing serialized strings.
   */
  generateSerializedDataScript () {
    const cachedSerializedData = this.poller.cache.serializedData ? this.poller.cache.serializedData : '{}'
    return `<script>
      window.__splitCachePreload = ${cachedSerializedData};
    </script>`
  }
}

module.exports = DataSerializer
