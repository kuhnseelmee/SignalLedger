# Evidence Model

Evidence objects are stored outside the signal record as object storage references.

Minimum metadata:

- `tenant_id`
- `uploaded_by_user_id`
- `kind`
- `filename`
- `content_type`
- `size_bytes`
- `storage_uri`
- `sha256`
- `verification_status`

Evidence binaries are not embedded in signal events. Signal events only store evidence references.
