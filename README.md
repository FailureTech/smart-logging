# smart-logging

**Import it once. All your `console.*` logs become async-aware, pretty Pino logs with timestamps and file names—no other changes needed.**

Ideal when you just want to install a logger and let it handle every `console.log` in the project automatically.

## Install

```bash
npm install smart-logging
# or
yarn add smart-logging
# or
pnpm add smart-logging
```

## Why smart-logging?

| Before (plain `console.log`)                                  | After (`smart-logging`)                                                                 |
|---------------------------------------------------------------|----------------------------------------------------------------------------------------|
| Synchronous console writes can block during heavy logging     | Console calls are deferred, keeping the event loop responsive                          |
| No timestamp, file, or line information                       | Every message includes ISO timestamp plus the originating file and line                |
| Hard to trace errors—stack traces get lost in noisy output    | Pretty Pino formatting preserves stacks and structures them cleanly                    |
| Integrating a logger means rewriting every `console.*` call   | Import once; all existing `console.*` calls are patched automatically                  |
| Adding request/user metadata requires manual plumbing         | `addTag` lets you annotate logs with any key/value scope (requestId, userId, etc.)     |
| Existing projects without logging need major refactors        | Drop in the package, import it in the root file, and you’re done                       |

## 1. Enable automatic logging

Do this **once** in the entry file of your app (the place where everything starts). After this, every file can keep using plain `console.log`, `console.error`, etc.—they are all patched automatically.

### ESM entry (e.g. `index.mjs`, `app.js` in `"type": "module"`)

```javascript
import 'smart-logging';

console.log('Server booting');   // timestamp + file:line
console.error(new Error('Oops')); // pretty stack trace
```

Output:

```
2025-11-08 19:03:12.345  src/server.js:4 - Server booting
2025-11-08 19:03:12.352  src/server.js:5 - Oops
    Error: Oops
        at ...
```

### CommonJS entry (e.g. `index.js` without `"type": "module"`)

```javascript
require('smart-logging');

console.info('Ready to roll');
console.warn('Using CommonJS');
```

Output:

```
2025-11-08 19:05:01.410  src/index.js:4 - Ready to roll
2025-11-08 19:05:01.411  src/index.js:5 - Using CommonJS
```

> Format: `[time]  file:line - message`

That’s it. No manual logger instances, no extra function calls. Any module that uses `console` automatically inherits the new behaviour.

## 2. Optional tags (request IDs, users, feature flags…)

If you want to attach metadata to every log within a request, call `addTag`. You can use any key name (`requestId`, `userId`, `featureFlag`, `ip`, etc.). Values must be strings, numbers, booleans, or `null`—functions, objects, or arrays are rejected to keep logs safe and predictable.

```javascript
import 'smart-logging';
import { addTag, clearTags } from 'smart-logging';

addTag({ requestId: 'req-123', userId: 'user-99' });
console.log('Started processing');

addTag({ featureFlag: 'beta-payments' }); // merges with existing tags
console.warn('Customer in beta flow');

clearTags(); // reset when the request finishes
```

Logs emitted inside that async call chain will include `requestId`, `userId`, and `featureFlag` automatically:

```
2025-11-08 19:03:45.112  requestId: req-123 userId: user-99 featureFlag: beta-payments  api/orders.js:27 - Customer in beta flow
```

## What smart-logging does for you

- 🪄 Monkey-patches `console.log`, `info`, `warn`, `error`, and `debug`
- 🕒 Adds ISO timestamps and prettified output via `pino-pretty`
- 📁 Prints the relative file name and line number that produced the log
- 🧵 Uses `AsyncLocalStorage` to carry tags across async boundaries
- 🚨 Hooks `uncaughtException`, `unhandledRejection`, `SIGINT`, and process exit to log cleanly
- 🧰 Works in both ESM and CommonJS projects out of the box

## Troubleshooting

- **Publishing:** bump the version before each `npm publish`.  
- **Tags not showing:** ensure `addTag` runs before the first log in the async path.  
- **Want custom formatting?** Fork and tweak `support/core/logger-core.cjs`.

## License

[ISC](./LICENSE)
