'use strict'

const DEFAULT_SCRIPT = `<script>
  window.__splitCachePreload = {};
</script>`

class DataSerializer {
  constructor ({ poller }) {
    this.poller = poller
  }

  /**
   * Get latest split and segment data and return a script containing serialized strings.
   */
  generateSerializedDataScript () {
    return this.poller.cachedSerializedDataScript ? this.poller.cachedSerializedDataScript : DEFAULT_SCRIPT
  }
}

module.exports = DataSerializer
