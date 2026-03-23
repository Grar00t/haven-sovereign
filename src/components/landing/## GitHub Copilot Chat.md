## GitHub Copilot Chat

- Extension: 0.38.1 (prod)
- VS Code: 1.110.0 (0870c2a0c7c0564e7631bfed2675573a94ba4455)
- OS: win32 10.0.26200 arm64
- GitHub Account: Grar00t

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: Error (2 ms): getaddrinfo ENOTFOUND api.github.com
- DNS ipv6 Lookup: Error (1 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): Error (2 ms): Error: net::ERR_NAME_NOT_RESOLVED
    at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
    at SimpleURLLoaderWrapper.emit (node:events:519:28)
    at SimpleURLLoaderWrapper.emit (node:domain:489:12)
    at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
    at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (8 ms): Error: getaddrinfo ENOTFOUND api.github.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
    at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (15 ms): TypeError: fetch failed
    at node:internal/deps/undici/undici:14902:13
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at n._fetch (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5000:4900)
    at n.fetch (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5000:4212)
    at d (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5032:190)
    at Jm._executeContributedCommand (file:///c:/Users/Iqd20/AppData/Local/Programs/Microsoft%20VS%20Code/0870c2a0c7/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND api.github.com
      at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
      at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: Error (1 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- DNS ipv6 Lookup: Error (0 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (12 ms)
- Electron fetch (configured): Error (3 ms): Error: net::ERR_NAME_NOT_RESOLVED
    at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
    at SimpleURLLoaderWrapper.emit (node:events:519:28)
    at SimpleURLLoaderWrapper.emit (node:domain:489:12)
    at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
    at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (8 ms): Error: getaddrinfo ENOTFOUND api.githubcopilot.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
    at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (19 ms): TypeError: fetch failed
    at node:internal/deps/undici/undici:14902:13
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at n._fetch (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5000:4900)
    at n.fetch (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5000:4212)
    at d (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5032:190)
    at Jm._executeContributedCommand (file:///c:/Users/Iqd20/AppData/Local/Programs/Microsoft%20VS%20Code/0870c2a0c7/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND api.githubcopilot.com
      at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
      at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: Error (3 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- DNS ipv6 Lookup: Error (1 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (2 ms)
- Electron fetch (configured): Error (3 ms): Error: net::ERR_NAME_NOT_RESOLVED
    at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
    at SimpleURLLoaderWrapper.emit (node:events:519:28)
    at SimpleURLLoaderWrapper.emit (node:domain:489:12)
    at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
    at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (8 ms): Error: getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
    at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (24 ms): TypeError: fetch failed
    at node:internal/deps/undici/undici:14902:13
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at n._fetch (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5000:4900)
    at n.fetch (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5000:4212)
    at d (c:\Users\Iqd20\.vscode\extensions\github.copilot-chat-0.38.1\dist\extension.js:5032:190)
    at Jm._executeContributedCommand (file:///c:/Users/Iqd20/AppData/Local/Programs/Microsoft%20VS%20Code/0870c2a0c7/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
      at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
      at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://mobile.events.data.microsoft.com: Error (3 ms): Error: net::ERR_NAME_NOT_RESOLVED
    at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
    at SimpleURLLoaderWrapper.emit (node:events:519:28)
    at SimpleURLLoaderWrapper.emit (node:domain:489:12)
    at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
    at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
Connecting to https://dc.services.visualstudio.com: Error (6 ms): Error: net::ERR_NAME_NOT_RESOLVED
    at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
    at SimpleURLLoaderWrapper.emit (node:events:519:28)
    at SimpleURLLoaderWrapper.emit (node:domain:489:12)
    at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
    at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: Error (11 ms): Error: getaddrinfo ENOTFOUND copilot-telemetry.githubusercontent.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
    at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: Error (17 ms): Error: getaddrinfo ENOTFOUND copilot-telemetry.githubusercontent.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
    at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
Connecting to https://default.exp-tas.com: Error (11 ms): Error: getaddrinfo ENOTFOUND default.exp-tas.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
    at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Number of system certificates: 60

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).