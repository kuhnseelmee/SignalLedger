# CI

SignalLedger uses repository-level CI gates to protect the validation steps that were previously run manually before merge.

## What CI checks

The main workflow runs on pull requests to `main` and pushes to `main`:

- installs dependencies with `pnpm install --frozen-lockfile`
- checks formatting with `pnpm format` and fails if the formatter changes tracked files
- runs `pnpm lint`
- runs `pnpm typecheck`
- runs `pnpm test`
- runs `pnpm build`
- validates `docker compose config`

A separate smoke workflow checks lightweight repository hygiene and deployment configuration:

- `.env.example` exists
- `.env.production.example` exists
- no plain `.env` file is committed
- no obvious private key files are committed
- the rendered Compose file keeps the web front door on `127.0.0.1:18080`
- PostgreSQL, NATS, and MinIO are only published on `127.0.0.1`

## Why these gates exist

SignalLedger handles tenant-scoped evidence, audit logs, verification state, and public deployment boundaries. A change that breaks formatting, types, tests, build output, or Compose validity can silently weaken operational trust if it reaches `main`.

These gates make the repository harder to break accidentally and easier to review with confidence.

## Run locally

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config
```

If you want the same smoke checks used in CI, run:

```bash
test -f .env.example
test -f .env.production.example
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo ".env is committed"
  exit 1
fi
python3 - <<'PY'
import re
import subprocess
import sys

pattern = re.compile(r'(^|/)(id_rsa|id_dsa|id_ecdsa|id_ed25519|.*\.pem|.*\.key)$')
files = subprocess.check_output(["git", "ls-files"], text=True).splitlines()
matches = [path for path in files if pattern.search(path)]
if matches:
    for match in matches:
        print(match)
    print("private key material is committed")
    sys.exit(1)
PY
docker compose config --format json >/tmp/docker-compose.rendered.json
python3 - <<'PY'
import json
import subprocess
import sys

def load_compose():
    try:
        raw = subprocess.check_output(
            ["docker", "compose", "config", "--format", "json"],
            text=True,
        )
        return json.loads(raw)
    except Exception:
        raw = subprocess.check_output(["docker", "compose", "config"], text=True)
        return {"__raw__": raw}

def assert_local_port(entries, service, expected_target, expected_host_ports):
    ports = entries.get("services", {}).get(service, {}).get("ports", [])
    seen = []
    for port in ports:
        if isinstance(port, dict):
            host_ip = port.get("host_ip")
            published = str(port.get("published")) if port.get("published") is not None else None
            target = str(port.get("target")) if port.get("target") is not None else None
        else:
            value = str(port)
            if ":" not in value:
                continue
            parts = value.split(":")
            if len(parts) == 3:
                host_ip, published, target = parts
            elif len(parts) == 2:
                host_ip = None
                published, target = parts
            else:
                continue
        seen.append((host_ip, published, target))
        if target == str(expected_target) and published in expected_host_ports and (host_ip in (None, "127.0.0.1")):
            return
    print(f"{service} ports: {seen}")
    raise SystemExit(f"{service} is not bound to localhost as expected")

data = load_compose()
if "__raw__" in data:
    raw = data["__raw__"]
    expected = {
        "web": [("127.0.0.1", "18080", "80")],
        "postgres": [("127.0.0.1", "5435", "5432")],
        "nats": [("127.0.0.1", "4222", "4222"), ("127.0.0.1", "8222", "8222")],
        "minio": [("127.0.0.1", "9000", "9000"), ("127.0.0.1", "9001", "9001")],
    }
    for service, tuples in expected.items():
        for host_ip, published, target in tuples:
            needle = f"{host_ip}:{published}:{target}"
            if needle not in raw:
                raise SystemExit(f"missing compose binding: {service} -> {needle}")
else:
    assert_local_port(data, "web", 80, {"18080"})
    assert_local_port(data, "postgres", 5432, {"5435"})
    assert_local_port(data, "nats", 4222, {"4222"})
    assert_local_port(data, "nats", 8222, {"8222"})
    assert_local_port(data, "minio", 9000, {"9000"})
    assert_local_port(data, "minio", 9001, {"9001"})
PY
```

## When a gate fails

- Read the workflow log and identify the first failing command.
- Re-run the same command locally from the repository root.
- Fix the underlying issue, not the gate.
- If formatting changes, re-run the formatter and commit the resulting diff.
- If Compose changes, re-run `docker compose config` and the smoke checks before merging.

## Merge discipline

- Do not merge a pull request until the CI workflow is green.
- Treat any formatting, type, test, build, or Compose failure as a release-quality signal, not a nuisance.
- Keep changes small enough that CI failures can be traced to a single commit or narrow review set.
