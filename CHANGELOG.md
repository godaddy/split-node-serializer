# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://github.com/godaddy/split-node-serializer/compare/1.0.0...1.1.0) (2020-01-02)


### Features

* handle empty cache ([#27](https://github.com/godaddy/split-node-serializer/issues/27)) ([267a6c9](https://github.com/godaddy/split-node-serializer/commit/267a6c900140428d9d5355637d6d5a5e1ea37ff2))


### Bug Fixes

* **httpGet:** throw correct error for non-2XX responses ([#22](https://github.com/godaddy/split-node-serializer/issues/22)) ([a02f179](https://github.com/godaddy/split-node-serializer/commit/a02f179b1e2a3c755f200f53a48c2f4d1c87e871))
* **poller:** Accept splitIoApiKey as a param ([#21](https://github.com/godaddy/split-node-serializer/issues/21)) ([ce123e2](https://github.com/godaddy/split-node-serializer/commit/ce123e2002f75d2fde53dd0dafe6c922e0348745))

### [1.0.1](https://github.com/godaddy/split-node-serializer/compare/1.0.0...1.0.1) (2019-12-20)


### Bug Fixes

* **poller:** Accept splitIoApiKey as a param ([#21](https://github.com/godaddy/split-node-serializer/issues/21)) ([ce123e2](https://github.com/godaddy/split-node-serializer/commit/ce123e2002f75d2fde53dd0dafe6c922e0348745))

## 1.0.0 (2019-12-20)


### Features

* **data-serializer:** add function to generate script ([#11](https://github.com/godaddy/split-node-serializer/issues/11)) ([e423c8f](https://github.com/godaddy/split-node-serializer/commit/e423c8f0a29a76ff7b23aa8ba57c39c89141991b))
* **poller:** add poller to periodically fetch data from split.io ([#8](https://github.com/godaddy/split-node-serializer/issues/8)) ([d87c073](https://github.com/godaddy/split-node-serializer/commit/d87c0735195c70380e9b4ac1589621eab64ab510))
* **split-node-serializer:** setup and outline classes ([#1](https://github.com/godaddy/split-node-serializer/issues/1)) ([40deda1](https://github.com/godaddy/split-node-serializer/commit/40deda135f1287de1828fb3cf669e95d6fc99b1c))
* **splitio-api-binding:** add function to poll for split changes ([#5](https://github.com/godaddy/split-node-serializer/issues/5)) ([1cb5f09](https://github.com/godaddy/split-node-serializer/commit/1cb5f09f4132160c04aedc8c751a3042bb58919f))
* **splitio-api-binding:** add helper function for getting segment names in use ([#12](https://github.com/godaddy/split-node-serializer/issues/12)) ([8d73e97](https://github.com/godaddy/split-node-serializer/commit/8d73e97382df71c4614601823d4bc83384260047))
* **splitio-api-binding:** implement getSegmentsForSplits ([#19](https://github.com/godaddy/split-node-serializer/issues/19)) ([dfac9a1](https://github.com/godaddy/split-node-serializer/commit/dfac9a1594f689dd1f277633d55bb1c867133cb9))
* **splitio-api-wrapper:** implement httpGet function ([#3](https://github.com/godaddy/split-node-serializer/issues/3)) ([b1a3a0e](https://github.com/godaddy/split-node-serializer/commit/b1a3a0efc9b870b2a756caa2db7f36f781bc85f3))


### Bug Fixes

* **splitio-api-binding:** filter out archived splits ([#10](https://github.com/godaddy/split-node-serializer/issues/10)) ([b48af5a](https://github.com/godaddy/split-node-serializer/commit/b48af5a4bdb0f538b7886864211b5fd27597702c))
* **splito-api-binding:** ensure latest splits are saved and add tests ([#15](https://github.com/godaddy/split-node-serializer/issues/15)) ([86fa340](https://github.com/godaddy/split-node-serializer/commit/86fa340c58306f2892b2593d53e98912f3dd6943))
