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
    return `<script>
      window.__splitCachePreload = {
        splitsJSON: ${JSON.stringify(latestData.splitChanges)},
        splitsChangeNumber: ${latestData.since},
        segments: ${JSON.stringify(latestData.segmentChanges)},
        splitsUsingSegments: ${latestData.splitsUsingSegments}
      };
    </script>`
  }
}

module.exports = DataSerializer
