# Working in this repo (sandbox notes)

Base44 runs this project with Docker compose so the preview reflects edits live:

```bash
docker compose -f docker-compose.base44.yml up -d --build   # boot the stack
docker compose -f docker-compose.base44.yml ps              # status + health
docker compose -f docker-compose.base44.yml logs -f web     # dev server / compile output
```

Web entry point is host port **3000**.

## Non-obvious findings

- **The repo currently contains configuration only — no application source.** There is
  no `app/`, `pages/`, `components/`, `lib/` or `hooks/` directory, so
  `next dev` starts, prints `Ready`, then exits with
  `Error: > Couldn't find any 'pages' or 'app' directory. Please create one under the
  project root`. Nothing renders until the source files are added. This is the only
  reason the preview cannot come up; the toolchain itself works.
- `components.json` expects the app root to be `app/` with `app/globals.css` and
  aliases `@/components`, `@/lib`, `@/hooks` (`@/*` → repo root, per `tsconfig.json`).
- `package.json` pins `packageManager: pnpm@12.3.4`. The `node:22` image has no pnpm,
  so the compose startup activates it through corepack before installing. Use
  `corepack prepare pnpm@12.3.4 --activate` rather than a different pnpm version —
  `pnpm-lock.yaml` is `lockfileVersion: 9.0` and `--frozen-lockfile` is enforced.
- Dependencies are installed **on container startup**, not in the image, and
  `node_modules` lives in a named volume (`app_web_node_modules`) so the sandbox
  checkout stays clean. After changing `package.json`/`pnpm-lock.yaml` just restart
  the service — no image rebuild needed.
- Postgres 16 runs as the `db` service (`pg`, `drizzle-orm` and `better-auth` are
  direct dependencies). It is reachable as `postgres://app:app@db:5432/app` inside
  the compose network and is passed to the app as `DATABASE_URL`. There is no
  `drizzle.config.*` or migration folder in the repo, so there are no migrations or
  seeds to run yet.
- `next dev` must bind `0.0.0.0` — the compose command passes
  `-H 0.0.0.0 -p 3000`. Note that `pnpm dev -- -H ...` does **not** work here: pnpm
  forwards the literal `--` and Next reads it as a project directory. Use
  `./node_modules/.bin/next dev -H 0.0.0.0 -p 3000` (or `pnpm dev -H 0.0.0.0 -p 3000`).
- Next gates cross-origin dev requests by Origin. `next.config.mjs` appends the
  preview origin (`3000-$BASE44_PUBLIC_HOST_SUFFIX`) to `allowedDevOrigins` **only**
  when `BASE44_PREVIEW_MODE === "1"`; with the flag unset the config is unchanged.
  Both `BASE44_PREVIEW_MODE` and `BASE44_PUBLIC_HOST_SUFFIX` are passed into the
  `web` service by the compose file — never hardcode the resolved host.
- Secrets from the Base44 dashboard arrive at `/run/base44/app.env` (outside the
  repo) and are wired in as the last `env_file:` entry, so dashboard values always
  win over compose defaults. No external credential is required to boot today.

## Verifying a change

`curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3000/` should return a
real page once source exists; `docker compose ps` should show `db` and `web` both
`healthy`. Compile errors surface in `logs web`, not in the curl status alone.
