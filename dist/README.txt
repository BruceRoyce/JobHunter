Job Hunter (Record) — portable build
=====================================

This folder is self-contained. Move or copy it anywhere; your records travel with it.

Requirements: Deno 2.2 or newer (https://deno.com). Nothing else; no internet needed
except when freezing a job advert from a URL.

Run
  Windows:  double-click start.cmd   (or: deno run --allow-net --allow-read --allow-write --allow-env --allow-sys server\main.ts)
  macOS/Linux:  ./start.sh
Then open http://127.0.0.1:8787

No Deno? If job-hunter.exe is present (deno task compile:windows), double-click it instead
and open http://127.0.0.1:8787. Keep it inside this folder so it finds public/ and data/.

Data
  data/app.db       SQLite database (created on first run)
  data/files/       one sub-folder per application: CV, cover letter, frozen job advert

Options (environment variables)
  PORT=8787  HOST=127.0.0.1  JOB_HUNTER_DATA=<other data folder>

Back up by copying the data/ folder while the app is stopped.
