# Changelog

## 1.0.1
- Stop retrying after a 4xx `loginSdk`/`loginSdkServer` response. Bad credentials now surface as an integration error instead of an upload-retry loop against the server.

## 1.0.0
- First release. The client auth and session layer extracted from the core split — the `Shipbook` class, session manager, login, and the `SBCloudAppender` used by the browser and React Native SDKs.
