# Working in this repo (sandbox notes)

**Control de Flota · Logística M&G** (TMS): Next.js 16 App Router, React 19, Tailwind v4,
shadcn-style UI in `components/ui`, Postgres + drizzle for storage. The board is opened
by direct access — there is no sign-in step.

Base44 runs it with Docker compose so the preview reflects edits live:

```bash
docker compose -f docker-compose.base44.yml up -d --build   # boot the stack
docker compose -f docker-compose.base44.yml ps              # status + health
docker compose -f docker-compose.base44.yml logs -f web     # dev server / compile output
docker compose -f docker-compose.base44.yml restart web     # after dependency changes
```

Web entry point is host port **3000**.

## Non-obvious findings

### Direct access — the sign-in panel was removed on purpose
`app/page.tsx` renders `<AppShell />` unconditionally and `app/actions/fleet.ts` no longer
checks a session, so `/` opens the board straight away. The login UI and everything that
existed to gate on a session were deleted:

- `components/fleet/auth-screen.tsx` (the sign-in / pending-approval panel)
- `components/fleet/users-view.tsx` + `app/actions/users.ts` (admin approval screen) and
  the "Usuarios" tab, which only made sense with accounts
- `lib/session.ts` (`getCurrentUser` / `requireApprovedUser` / `requireAdmin`)
- the signed-in user chip and "Cerrar sesión" button in `components/fleet/header.tsx`

**Do not reintroduce an auth gate without asking the user** — direct access is the
intended behaviour of this app now.

### Inert auth plumbing (leave alone)
`lib/auth.ts`, `lib/auth-client.ts`, `lib/auth-shared.ts`, `app/api/auth/[...all]/route.ts`
and the `better-auth` dependency are still in the repo but nothing in the app uses them:
no component renders a sign-in, no request requires a session, and no Google/Microsoft
credential is needed to boot or to use any screen. `better-auth` is intentionally **not**
removed from `package.json` because the compose install runs `pnpm install
--frozen-lockfile`; editing dependencies would require regenerating `pnpm-lock.yaml` too.
`lib/db/ensure-schema.ts` still asks better-auth to create its `user`/`session`/`account`/
`verification` tables — they sit unused and harmless.

### CRITICAL: Server Actions need an origin allowlist in the preview
The preview proxy rewrites the host, so Next sees `origin: https://3000-<suffix>.<domain>`
against a forwarded host of `3000-<sandbox-id>.<domain>` and aborts **every** Server Action
with `` `x-forwarded-host` … does not match `origin` … Aborting the action `` → HTTP 500.
`next.config.mjs` therefore sets, only when `BASE44_PREVIEW_MODE === "1"`:

```js
allowedDevOrigins: [previewHost],                       // dev assets / HMR
experimental: { serverActions: { allowedOrigins: [previewHost] } }   // load/save the day
```

`previewHost` is `3000-$BASE44_PUBLIC_HOST_SUFFIX`. The compose file passes
`BASE44_PREVIEW_MODE` and `BASE44_PUBLIC_HOST_SUFFIX` into the `web` service; with the flag
unset the config is byte-for-byte the original. If every "Guardar Día" / page load starts
returning 500 in the sandbox, check this first — the error only appears in `logs web`.

### Database
- `lib/db/ensure-schema.ts` creates the schema idempotently on the first database access
  (better-auth's tables plus `fleet_state`). **There is no migration runner, no drizzle-kit
  config and no SQL folder, so there is nothing to run before booting.**
- `fleet_state` keeps the whole board in one JSON row (`id = 'main'`), written by
  `saveFleetState` when the user clicks **Guardar Día** and read back on page load by
  `loadFleetState`. An empty table means the board starts from the seed data in
  `lib/fleet-data.ts`.

### Compose / toolchain
- `package.json` pins `packageManager: pnpm@12.3.4`; the `node:22` image has no pnpm, so
  the startup command activates it through corepack. Keep that version — `pnpm-lock.yaml`
  is `lockfileVersion: 9.0` and `--frozen-lockfile` is enforced.
- Dependencies install **on container startup**, not in the image, with `node_modules` in a
  named volume (`app_web_node_modules`), so manifest edits need only a service restart.
- `pnpm dev -- -H 0.0.0.0 -p 3000` does **not** work: pnpm forwards the literal `--` and
  Next reads it as a project directory. The compose command calls
  `./node_modules/.bin/next dev -H 0.0.0.0 -p 3000` directly.
- Secrets from the Base44 dashboard arrive at `/run/base44/app.env` (outside the repo) and
  are wired in as the last `env_file:` entry. None are required today. Postgres credentials
  are local infra, generated inline in compose: `postgres://app:app@db:5432/app` as
  `DATABASE_URL`.

## Verifying a change

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3000/     # expect 200
docker compose -f docker-compose.base44.yml logs web --tail=30       # Server Action errors show here
docker compose -f docker-compose.base44.yml exec -T db \
  psql -U app -d app -c "select id from fleet_state;"                # board persistence
```

`docker compose ps` should show `db` and `web` both `healthy`. Past the render, the two
paths worth exercising are the section tabs and **Guardar Día** (it must show the green
"Día guardado…" toast, not an error). A verification save leaves one `fleet_state` row —
delete that row afterwards if it was only a test.
