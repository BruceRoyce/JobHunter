# Job Hunter (Tracker)

A calm, portable tracker for the jobs you have applied to — or intend to.
Deno + SQLite on the server, Vite + React + TypeScript + Tailwind + Zustand in the browser.
Everything (app, database and files) lives in one folder you can move.

## Requirements

- [Deno](https://deno.com) 2.2 or newer (uses the built-in `node:sqlite`; no native add-ons, no other runtime).
  Windows: `irm https://deno.land/install.ps1 | iex`

## Quick start

```sh
deno task setup      # install front-end packages (once)
deno task build      # build the portable app into dist/
deno task start      # run it → http://127.0.0.1:8787
```

Development (hot reload for both halves):

```sh
deno task dev        # API on :8787 (watch mode) + Vite on http://localhost:5173 — open the Vite URL
```

Other tasks:

| Task                        | What it does                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `deno task check`           | Type-check server and front-end                                                            |
| `deno task smoke`           | End-to-end API smoke test against `dist/` with a throwaway data folder (run `build` first) |
| `deno task compile:windows` | Optional: single `dist/job-hunter.exe` (no Deno needed on the target PC, ~80 MB)           |

## Portable build (`dist/`)

```
dist/
  server/        API + static server (TypeScript, no remote imports — runs offline)
  public/        compiled front-end, fonts bundled (Inter Variable with optical sizing, IBM Plex Sans Variable)
  data/          created on first run → app.db + files/<one folder per application>/
  start.cmd      Windows launcher (opens the browser)
  start.sh       macOS / Linux launcher
  README.txt
```

Copy or move `dist/` anywhere — the records come with it. Rebuilding never touches `dist/data/`.
If you compile the `.exe`, keep it inside `dist/` so it finds `public/` and `data/` beside it.

Environment variables: `PORT` (8787), `HOST` (127.0.0.1), `JOB_HUNTER_DATA` (alternative data folder).

## How it works

**Pane one — ADD / Edit.** `ADD` expands the _Record an application_ form. Via Employer requires the employer
name; via Agency shows and requires the agency name. Validation runs in the browser and again on the server; on
any error the message is shown and every entry (including chosen files) is kept so you can retry.

**On Save**

1. The advert at the URL is fetched once and **frozen**: PDF, JPEG and PNG are stored as-is; web pages are stored
   as an HTML snapshot (with a provenance comment and `<base>` tag). If the site cannot be captured the record is
   still saved and a warning is shown; you can then upload the advert file yourself (or Update retries the URL)
   until one has been frozen.
2. A sub-folder `year_month_Employer-name_Agency-name_Job-Title` is created under `data/files/` (filesystem-safe;
   empty parts omitted; `-2`, `-3`… added if the name already exists). CV, cover letter and advert go in it.
3. The record is inserted with the folder and stored file names (relative paths). If anything fails, the
   half-written folder is removed.

**On Update** — fields are updated; a new CV / cover letter replaces the old file (staged first, swapped only after
the database commit). Changing the status adds a status-change event (date picker, default today); every existing
event's date (and status) can be corrected. **The frozen advert is never overwritten**: the server refuses to
replace it and a SQLite trigger makes the advert columns immutable once set.

**Pane two — Records.** Cards show star, employer/agency, title, colour-coded status, URL (new tab), View CV /
View Cover Letter / View frozen Job Description, and collapsed _Notes_ (Markdown, sanitised) and _Events_
(chronological) accordions. Sort by last update date / job title / employer-or-agency name / salary
(numeric value parsed from the text, e.g. `£55k`), filter by status, _Clear filters_, 50 per page with a paginator,
and _Export All_ → CSV with `Job Title, Employer Name, Agency Name` (UTF-8 with BOM for Excel; formula-injection safe).

Frozen web pages are served with a `sandbox` Content-Security-Policy so their scripts never run.

## API

| Method | Path                                                                        |                                                                      |
| ------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| GET    | `/api/jobs?sort=updated\|title\|name\|salary&dir=asc\|desc&status=…&page=1` | paged list (50) with events                                          |
| POST   | `/api/jobs`                                                                 | create (multipart: fields + `cv`, `cover_letter`, optional `advert`) |
| GET    | `/api/jobs/:id`                                                             | one record                                                           |
| PUT    | `/api/jobs/:id`                                                             | update (multipart; `events` = JSON `[{id?, status, event_date}]`)    |
| GET    | `/api/jobs/:id/files/cv\|cover-letter\|advert`                              | view stored file inline (`?download=1` to save)                      |
| GET    | `/api/export.csv`                                                           | export all records                                                   |
| GET    | `/api/health`                                                               | health check                                                         |

Status values: `Applied`, `Interested`, `Going to interview`, `unsuccessful`, `successful`, `Closed`.

## Project layout

```
server/    main.ts (HTTP + static), jobs.ts (rules), db.ts (schema), freeze.ts (advert capture), paths.ts, util.ts
web/       Vite React app (src/components, src/store.ts — Zustand, src/api.ts)
scripts/   build.ts (assembles dist/), dev.ts, smoke.ts
data/      development data (git-ignored)
```

Back up by copying `data/` (or `dist/data/`) while the app is stopped.
