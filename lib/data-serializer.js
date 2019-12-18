'use strict'

class DataSerializer {
  constructor ({ poller }) {
    this.poller = poller
  }

  /**
   * Get latest split and segment data and return a script containing serialized strings.
   */
  generateSerializedDataScript () {
    const latestData = this.poller.cache
    return `<script>
      window.__splitCachePreload = {
        splitsData: ${JSON.stringify(latestData.splits)},
        since: ${latestData.since},
        segmentsData: ${JSON.stringify(latestData.segments)},
        usingSegmentsCount: ${latestData.usingSegmentsCount}
      };
    </script>`
  }
}

module.exports = DataSerializer
