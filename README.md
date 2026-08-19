# Angular TransferState Prototype Mutation PoC

This Angular SSR PoC shows how attacker-controlled `TransferState` keys can progress from an inherited lookup into request-scoped `HttpTransferCache` poisoning.

## Cases

| Route                                    | Impact                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/poc/constructor-only/constructor`      | Inherited missing-key lookup. No prototype mutation.                                       |
| `/poc/proto-only/__proto__`              | Local prototype mutation, but no arbitrary HTTP cache poison with a fixed response schema. |
| `/poc/cache-poison/resource/__proto__`   | One forged `HttpTransferCache` response through `resource()`.                              |
| `/poc/cache-poison/rxresource/__proto__` | Same primitive through `rxResource()`.                                                     |
| `/poc/multi-request/__proto__`           | One prototype substitutes several HTTP responses in the same SSR render.                   |
| `/poc/confused-deputy/__proto__`         | Forged policy/tenant state makes SSR perform a privileged request with its own credential. |
| `/poc/namespaced-safe/__proto__`         | Safe control: `cms:__proto__` does not mutate the prototype.                               |


The attacker is a low-privileged CMS/plugin editor who can choose a slug and create normal key/value settings. The backend legitimately converts those settings with `Object.fromEntries()`.

```text
slug = "__proto__" + dynamic settings
        ↓
resource({ id: slug })
        ↓
TransferState prototype mutation
        ↓
inherited HttpTransferCache keys
        ↓
forged HttpResponse
        ↓
authoritative request skipped
```

## Validate

Install and build:

```bash
npm install
npm run build
```

Start the SSR server:

```bash
npm run serve:ssr
```

In another terminal run:

```bash
npm run validate
```

`validate.mjs` uses only Node.js. It seeds the attacker-controlled CMS settings, requests every SSR route, reads the returned HTML, and checks that the expected values were actually rendered. It also compares the backend hit counters to confirm when an authoritative request was skipped.

A successful run ends with:

```text
✓ constructor-only
✓ proto-only
✓ cache-poison/resource
✓ cache-poison/rxresource
✓ multi-request
✓ confused-deputy
✓ namespaced-safe

All TransferState PoC cases validated successfully.
```

The two most important controls are:

- `proto-only`: `prototypeMutated=true`, but the real policy endpoint is still reached.
- `namespaced-safe`: `cms:__proto__` does not mutate the prototype and all authoritative requests are reached.

The strongest case is `confused-deputy`: policy/bootstrap/profile are substituted, their real endpoints are skipped, and SSR reaches the protected secret endpoint using its server-only credential.


```text
constructor
→ inherited lookup confusion

__proto__ only
→ local prototype mutation

+ attacker-controlled dictionary keys
→ HttpTransferCache response poisoning

+ multiple request keys
→ multi-request response substitution

+ sensitive SSR/BFF policy
→ privileged server-side action / confused deputy
```

Prefixing attacker-controlled ids, for example `cms:${slug}`, prevents this attack path.
