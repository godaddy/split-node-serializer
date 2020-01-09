# split-node-serializer

Fetches split definitions and segments from Split.io and serializes them into a
set of strings that the JavaScript SDK can consume.

## Installation

Install via npm:

```console
$ npm i @godaddy/split-node-serializer --save
```

## Usage

Use this package in your server-side Node.js environment. The serializer exposes:
1. a `Poller` that periodically requests raw experiment configuration data from Split.io. Requests happen in the background and the poller caches the latest data in local memory.
1. a `DataSerializer` that reads from the poller's cache, serializes the data, and returns it in a script to be injected into a client's HTML.

### Constructor

Create an instance of `Poller` and `DataSerializer`:

```js
const { Poller, DataSerializer } = require('@godaddy/split-node-serializer')

const poller = new Poller({
  splitioApiKey: 'YOUR_API_KEY',
  pollingRateSeconds: 600,
  serializeSegments: false
})

const dataSerializer = new DataSerializer({ poller })
```

The following option properties are available to the `Poller`:

| Property                      | Description |
|-------------------------------|-------------|
| splitioApiKey | The Split.io SDK key for the environment your app is running in. (required) |
| pollingRateSeconds | The interval at which to poll Split.io. Defaults to 300 (5 minutes). |
| serializeSegments | Whether or not to fetch segment configuration data. Defaults to false. |

#### Serializing segments

Segments are pre-defined groups of customers that features can be targeted to. More info [here](https://help.split.io/hc/en-us/articles/360020407512-Create-a-segment).

**Note:** Requesting serialized segments will increase the size of your response. Segments can be very large if they include all company employees, for example.

### Methods

#### start

Make an initial request for changes and start polling for raw configuration data
every `pollingRateSeconds`:

```js
poller.start()
```

#### stop
To stop the poller:

```js
poller.stop()
```

The poller emits an `error` event on errors from the Split.io API.

#### generateSerializedDataScript

`generateSerializedDataScript` will read the latest data from the cache and return a script
that adds serialized data to the `window.__splitCachePreload` object. The
serialized data will be used to determine cohort allocations.

```js
const serializedDataScript = dataSerializer.generateSerializedDataScript()

console.log(serializedDataScript)

//<script>
//  window.__splitCachePreload = {
//    splitsData: '{"split-1-name":{"name":"split-1-name","status":"bar"},"split-2-name":{"name":"split-2-name","status":"baz"}}',
//    since: 1,
//    segmentsData: '{"test-segment":{"name":"test-segment","added":["foo","bar"]}}',
//    usingSegmentsCount: 2
//  };
//</script>
```

## Testing

Run the linter:

```console
$ npm run lint
```

Run unit tests:

```console
$ npm test
```

Generate a coverage report:

```console
$ npm run coverage
```

## License

[MIT](LICENSE)
