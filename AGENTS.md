# Working in this repo (sandbox notes)

This is **Control de Flota · Logística M&G** (TMS): a Next.js 16 App Router app with
React 19, Tailwind v4, shadcn-style UI in `components/ui`, better-auth for sign-in and
Postgres + drizzle for storage.

Base44 runs it with Docker compose so the preview reflects edits live:

```bash
docker compose -f docker-compose.base44.yml up -d --build   # boot the stack
docker compose -f docker-compose.base44.yml ps              # status + health
docker compose -f docker-compose.base44.yml logs -f web     # dev server / compile output
docker compose -f docker-compose.base44.yml restart web     # after dependency changes
```

Web entry point is host port **3000**.

## Non-obvious findings

### Where the code came from
`main` shipped only part of the app (`app/actions`, `components/fleet`, `lib`) — no
`app/layout.tsx`, `app/page.tsx`, `app/globals.css`, no auth route and no user
management — so `next dev` could not serve anything. The complete app lives on the
`nextjs-entry-points` branch and was merged into this branch. If a future import looks
"incomplete" again, check that branch before assuming files are missing.

### Authentication (the main blocker for using the app)
- Sign-in is **better-auth** with social providers only; the sign-in screen
  (`components/fleet/auth-screen.tsx`) renders one button per configured provider and,
  when none is configured, a warning that sign-in is disabled. There is **no
  email/password form in the UI**, even though `emailAndPassword` is enabled in
  `lib/auth.ts` — so without OAuth credentials the dashboard behind login is
  unreachable.
- Providers activate only when their env vars exist:
  `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` for Google,
  `MICROSOFT_CLIENT_ID` + `MICROSOFT_CLIENT_SECRET` (+ optional `MICROSOFT_TENANT_ID`,
  defaults to `common`) for Outlook. They are optional for **booting** — the app starts
  and renders the sign-in screen without them.
- In the sandbox the OAuth redirect URIs must point at the public preview origin:
  `https://3000-$BASE44_PUBLIC_HOST_SUFFIX/api/auth/callback/google` (and `.../microsoft`).
  `lib/auth.ts` already derives `baseURL` from `BASE44_PREVIEW_MODE` /
  `BASE44_PUBLIC_HOST_SUFFIX`, and adds the same origin to `trustedOrigins` — both gated
  on `BASE44_PREVIEW_MODE === "1"`, so with the flag unset the origin lists are
  unchanged. The compose file passes both variables into the `web` service; never
  hardcode the resolved host.
- `advanced.defaultCookieAttributes` (`SameSite=None`, `Secure`) apply in development
  because the preview is a cross-site iframe. Removing them makes login appear to
  succeed and then look signed out.

### Database
- `lib/db/ensure-schema.ts` creates everything idempotently on first database access:
  better-auth's `user` / `session` / `account` / `verification` tables through its own
  migration API, plus `fleet_state` matching `lib/db/schema.ts`. **There is no migration
  runner, no drizzle-kit config and no SQL folder, so there is nothing to run before
  booting.**
- Because the tables are created lazily, the very first request logs
  `ERROR [Better Auth]: Database schema mismatch — Missing tables ...`. It is a
  first-boot artifact only: the tables exist right after, and later requests are clean.
- The first account to sign up becomes `admin` / `approved`; every later account lands
  as `supervisor` / `pending` and stays locked out until an admin approves it in the
  Users view. A test account therefore consumes the first-admin slot — don't create one
  casually.
- `fleet_state` holds the whole board as a single JSON row (`id = 'main'`), written
  through the server actions in `app/actions/fleet.ts`, which require an approved user.

### Compose / toolchain
- `package.json` pins `packageManager: pnpm@12.3.4`. The `node:22` image has no pnpm, so
  the startup command activates it with corepack. Keep that version — `pnpm-lock.yaml`
  is `lockfileVersion: 9.0` and `--frozen-lockfile` is enforced.
- Dependencies install **on container startup**, not in the image, with `node_modules`
  in a named volume (`app_web_node_modules`), so manifest/lockfile edits need only a
  service restart.
- `pnpm dev -- -H 0.0.0.0 -p 3000` does **not** work: pnpm forwards the literal `--` and
  Next reads it as a project directory. The compose command calls
  `./node_modules/.bin/next dev -H 0.0.0.0 -p 3000` directly.
- `next.config.mjs` appends the preview origin to `allowedDevOrigins` only when
  `BASE44_PREVIEW_MODE === "1"`, otherwise Next blocks the preview origin's dev
  asset/HMR requests.
- Secrets from the Base44 dashboard arrive at `/run/base44/app.env` (outside the repo)
  and are wired in as the last `env_file:` entry, so dashboard values win over compose
  defaults. Postgres credentials are local infra, generated inline in compose:
  `postgres://app:app@db:5432/app` as `DATABASE_URL`.

## Verifying a change

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3000/          # expect 200
curl -sS http://localhost:3000/api/auth/get-session                       # expect null when signed out
docker compose -f docker-compose.base44.yml exec -T db \
  psql -U app -d app -c '\dt'                                            # schema auto-created
```

`docker compose ps` should show `db` and `web` both `healthy`. Compile errors show up in
`logs web`, not in the curl status alone. Anything past the sign-in screen needs a real
OAuth account (and an admin approval for non-first accounts), so it cannot be checked
without credentials.
