@echo off
cd /d "%~dp0"
start "" http://127.0.0.1:8787
deno run --allow-net --allow-read --allow-write --allow-env --allow-sys server\main.ts
