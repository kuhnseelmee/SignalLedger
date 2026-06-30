# Event Model

Signal events are append-only records.

Important fields:

- `tenant_id`
- `domain`
- `type`
- `severity`
- `actor_*`
- `participant_id`, `property_id`, `shift_id`, `incident_id`
- `occurred_at`, `observed_at`, `received_at`
- `payload`
- `evidence`
- `previous_hash`
- `hash`
- `visibility`
- `retention_class`

Corrections are modeled as new events. Redactions should be represented as restricted projections or explicit redaction events.
