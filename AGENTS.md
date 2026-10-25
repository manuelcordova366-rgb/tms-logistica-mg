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
experimental: {
  agentUpgrade: 'security',   // recorded by `next upgrade --agent=security` (16.4.0 → 16.4.3)
  ...(previewHost ? { serverActions: { allowedOrigins: [previewHost] } } : {}), // load/save the day
},
...(previewHost ? { allowedDevOrigins: [previewHost] } : {}),   // dev assets / HMR
```

`agentUpgrade: 'security'` is always present (Next 16.4.3 supports the option) so the security
upgrade stays recorded even when the sandbox flag is unset; `serverActions.allowedOrigins` and
`allowedDevOrigins` still only appear inside the preview sandbox.

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

## Board modules (current state)

- **The board starts from zero records on request.** `SEED_UNITS`, `SEED_TRIPS`,
  `SEED_OPERADORES` and `SEED_HISTORY` in `lib/fleet-data.ts` are all `[]`, and the
  `fleet_state` row was deleted, so a fresh boot shows 0 viajes, 0 unidades and 0
  operadores. Everything is created by the user. A `fleet_state` row is only written by
  **Guardar Día**, so a fresh sandbox has no row at all.
- **Unidades / Patio**: units are captured by hand from Patio → *Registrar Unidad en Patio*,
  or with the CSV template.
- **Rol de Incidencias** (`components/fleet/incidencias-view.tsx`, tab `incidencias`):
  weekly Monday→Sunday log of asistencias / faltas / incapacidades / permisos / traslados /
  vacaciones. One `<select>` per operator-day; the value is stored in the board's
  `incidencias` map under `"<fecha ISO>|<operador>"` (`IncidenciaTipo`, `IncidenciaRegistro`
  in `lib/fleet-data.ts`) and an unregistered cell reads as `ASISTENCIA`. The search box
  filters by operator name (accent-insensitive).
- **Plantilla de operadores**: the roster is no longer derived from the trips — it lives in
  the board state (`operadores`, seeded from `SEED_OPERADORES`) and is edited **inside the
  Incidencias tab**: type a name + *Agregar operador*, *Plantilla* downloads
  `plantilla-operadores.csv` (a single `OPERADOR` column, header only, so uploading it
  unchanged adds nothing), *Subir Plantilla* reads that CSV (Excel must be saved as CSV,
  like the Patio template) and merges names without duplicates, uppercased and sorted
  (`mergeOperadores` in `lib/fleet-data.ts`). Each row also has a delete button.
  The roster travels in the same `fleet_state` JSON row as the rest of the board, so the
  log **and** the roster are written by **Guardar Día** (the toolbar button on that tab) and
  restored on page load.
- **Historial**: the "Historial" button and the restore dialog were removed on request.
  `saveDay` still appends to the persisted `history` array (kept so the stored schema does
  not break), but no screen browses or restores it.
- **Trip form** (`components/fleet/trip-dialog.tsx`): `pipa` ("Número de pipa") sits right
  next to *Unidad (ECO)* and is **typed by hand** — it is deliberately *not* a field of the
  Patio unit registry (`Unit` has no `pipa`). The old *Clóster* (`cluster`) and
  *Cajón / Rampa* (`rampa`) fields were removed from the form **and from the `Trip` type**:
  `ClusterTag`, the planeación/supervisor cluster cells and the patio card's rampa line are
  gone with them, and the planeación CSV export column `Cluster` became `Pipa`. The
  planeación CSV import accepts a `PIPA` column. If you ever need cluster/rampa back, they
  have to be re-added end to end.
- **Colocación** was replaced by the Rol de Incidencias: `components/fleet/colocacion-view.tsx`,
  `colocacion-report.tsx` and the data it used (`COLOCACION_EJECUTADAS`, `HEADCOUNT`,
  `MOVIMIENTOS_LABELS`) are gone.

## Brand, background and navigation

- **Palette comes from the logo.** `public/logistica-mg-logo.png` is a navy→sky gradient
  mark on white; its colours are sampled in `app/globals.css` as `--brand-navy #0a3767`,
  `--brand-blue #0b5a96`, `--brand-sky #77c8e7`, `--brand-teal #2b9788`. The dashboard
  surface (`--background #051f3d`, `--card`, `--secondary`, `--border`, `--input`) and
  `--primary #77c8e7` follow those blues; `--success #48b376` is the logo's green arrow tip.
  `--warning`, `--danger`/`--destructive` and `--violet` stay semantic (status pills, FORÁNEO
  tag). `app/layout.tsx`'s `themeColor` matches `--background`.
  Keep the UI dark: everything is built for white/blue ink on these surfaces.
- **Background carousel** (`components/fleet/brand-backdrop.tsx`, `-z-20`, decorative):
  four slides rotating every 7.5s — the fleet photo from
  `public/cedis-patio-trucks-header.png` (740×320, so it is used as a soft, veiled
  full-bleed image with a slow zoom) alternating with the two logo plates on a white
  card. Each slide carries its own scrim, so the panels (`bg-card/85 backdrop-blur`) stay
  readable; the photo veil is lighter than the plate veil on purpose, otherwise the photo
  disappears behind the cards. The caption/dots at the bottom only render at `lg` and sit
  under the dashboard panels. `prefers-reduced-motion` keeps the first slide still.
- **Sections live in one dropdown** (`components/fleet/section-menu.tsx`, used by the
  header): Patio, Planeación, Supervisor, Resumen, Incidencias. `TabId` is declared there
  and imported by `app-shell.tsx`; the units badge shows on the button only for Resumen.
  The menu closes on select, outside click and Escape.

## Verifying a change

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3000/     # expect 200
docker compose -f docker-compose.base44.yml logs web --tail=30       # Server Action errors show here
docker compose -f docker-compose.base44.yml exec -T db \
  psql -U app -d app -c "select id, data->'operadores', jsonb_array_length(data->'trips') from fleet_state;"
```

`docker compose ps` should show `db` and `web` both `healthy`. Past the render, the paths
worth exercising are the section **dropdown** (it replaced the old tab strip) and **Guardar
Día** (it must show the green "Día guardado…" toast, not an error). Saving the roster in
Incidencias is the shortest end-to-end check of the new persistence: add an operator, save,
reload — the roster must come back (`operadores` in the row). A verification save leaves one
`fleet_state` row; delete it afterwards so the board is back to its 0-records start
(`psql … -c "delete from fleet_state;"`).
