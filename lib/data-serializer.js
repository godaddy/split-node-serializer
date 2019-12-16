'use strict'

const Poller = require('./poller')
const SplitioApiBinding = require('./splitio-api-binding')

class DataSerializer {
  constructor ({
    splitioApiKey,
    pollingRateSeconds,
    poller,
    serializeSegments
  }) {
    this.poller = poller || new Poller({
      pollingRateSeconds,
      serializeSegments,
      splitioApi: new SplitioApiBinding({ splitioApiKey })
    })
  }

  /**
   * Get latest split and segment data and serialize into strings.
   */
  generateSerializedDataScript () {
    const latestData = this.poller.cache
    console.log(`<script>
      window.__splitCachePreload = {
        splitsData: ${JSON.stringify(latestData.splitChanges)},
        since: ${latestData.since},
        segmentsData: ${JSON.stringify(latestData.segmentChanges)},
        usingSegmentsCount: ${latestData.usingSegmentsCount}
      };
    </script>`)
    return `<script>
      window.__splitCachePreload = {
        splitsData: ${JSON.stringify(latestData.splitChanges)},
        since: ${latestData.since},
        segmentsData: ${JSON.stringify(latestData.segmentChanges)},
        usingSegmentsCount: ${latestData.usingSegmentsCount}
      };
    </script>`
  }
}

module.exports = DataSerializer
