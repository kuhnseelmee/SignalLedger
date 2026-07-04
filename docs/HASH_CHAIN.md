# Hash Chain

SignalLedger uses a per-tenant hash chain:

```text
hash = SHA256(canonical_json(event_without_hash) + ":" + previous_hash_or_GENESIS)
```

The chain is tenant-specific and ordered by event occurrence time, then creation time.

Tamper detection should flag:

- payload changes
- timestamp changes
- evidence reference changes
- broken previous hash links
- missing events
- cross-tenant contamination
