# split-node-serializer

Fetches split definitions and segments from Split.io and serializes them into a
set of strings that the JavaScript SDK can consume.

## Installation

Install via npm:

```console
$ npm i @godaddy/split-node-serializer --save
```

## Usage

Use this package in your server-side Node.js environment. The serializer exposes a poller that periodically requests raw experiment configuration data from Split.io. Requests happen in the background and the poller caches the latest data in local memory.

### Constructor

Create an instance `DataSerializer`:

```js
const DataSerializer = require('@godaddy/split-node-serializer')

const dataSerializer = new DataSerializer({
  splitioApiKey: 'YOUR_API_KEY',
  pollingRateSeconds: 600,
  serializeSegments: false
})
```

The following option properties are available:

| Property                      | Description |
|-------------------------------|-------------|
| splitioApiKey | The Split.io SDK key for the environment your app is running in. Can be requested in `#experimentation` on slack (required). |
| pollingRateSeconds | The interval at which to poll Split.io. Defaults to 300 (5 minutes). |
| serializeSegments | Whether or not to fetch segment configuration data. Defaults to false. *note:* support for getting segments is not available yet |

#### Serializing segments

Segments are pre-defined groups of customers that features can be targeted to. More info [here](https://help.split.io/hc/en-us/articles/360020407512-Create-a-segment).

**Note:** Requesting serialized segments will increase the size of your response.

### Methods

#### poll

The `DataSerializer` class has a `Poller`.

Start polling for raw configuration data:

```js
dataSerializer.poller.poll()
```

To stop the poller:
```js
dataSerializer.poller.stop()
```

The poller emits an `error` event on errors from the Split.io API.

#### getSerializedData

`getSerializedData` will read the latest data from the cache and return a script that adds serialized data to the `window.__splitCachePreload` object.

```js
dataSerializer.generateSerializedDataScript()
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
