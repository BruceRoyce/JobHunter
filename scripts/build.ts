// Builds the web front-end and assembles a self-contained, movable dist/ folder:
//   dist/server/*.ts   API + static server (no remote imports — runs offline)
//   dist/public/       compiled front-end (fonts bundled)
//   dist/data/         created on first run: app.db + files/
//   dist/start.cmd, dist/start.sh, dist/README.txt
const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
const deno = Deno.execPath();

async function run(args: string[], cwd: URL) {
  const { code } = await new Deno.Command(deno, {
    args,
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  }).output();
  if (code !== 0) throw new Error(`Command failed: deno ${args.join(" ")}`);
}

console.log("› Installing front-end dependencies");
await run(["install"], new URL("web/", root));
console.log("› Type-checking");
await run(["check", "server/main.ts"], root);
await run(
  ["run", "-A", "npm:typescript/tsc", "--noEmit", "-p", "."],
  new URL("web/", root),
);

// Keep an existing dist/data (user records) intact; replace everything else.
await Deno.mkdir(dist, { recursive: true });
for await (const e of Deno.readDir(dist)) {
  if (e.name === "data") continue;
  await Deno.remove(new URL(e.name, dist), { recursive: true });
}

console.log("› Building front-end");
await run(["run", "-A", "npm:vite", "build"], new URL("web/", root));

console.log("› Copying server");
await Deno.mkdir(new URL("server/", dist), { recursive: true });
for await (const e of Deno.readDir(new URL("server/", root))) {
  if (e.isFile && e.name.endsWith(".ts")) {
    await Deno.copyFile(
      new URL(`server/${e.name}`, root),
      new URL(`server/${e.name}`, dist),
    );
  }
}

const perms = "--allow-net --allow-read --allow-write --allow-env --allow-sys";
await Deno.writeTextFile(
  new URL("start.cmd", dist),
  `@echo off\r\ncd /d "%~dp0"\r\nstart "" http://127.0.0.1:8787\r\ndeno run ${perms} server\\main.ts\r\n`,
);
await Deno.writeTextFile(
  new URL("start.sh", dist),
  `#!/usr/bin/env sh\ncd "$(dirname "$0")"\nexec deno run ${perms} server/main.ts\n`,
);
try {
  await Deno.chmod(new URL("start.sh", dist), 0o755);
} catch {
  /* Windows */
}
await Deno.writeTextFile(
  new URL("README.txt", dist),
  `Job Hunter (Tracker) — portable build
=====================================

This folder is self-contained. Move or copy it anywhere; your records travel with it.

Requirements: Deno 2.2 or newer (https://deno.com). Nothing else; no internet needed
except when freezing a job advert from a URL.

Run
  Windows:  double-click start.cmd   (or: deno run ${perms} server\\main.ts)
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
`,
);
console.log(`\n✓ Portable build ready in ${new URL("dist/", root).pathname}`);
