# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OneClick is a personal data management desktop/mobile app (contacts, expenses, notes, reminders) built with Tauri 2 + Angular 20 + Rust. The frontend compiles to `dist/oneclick/browser/` and is embedded in the Tauri shell.

## Commands

Use `bun` as the package manager (not npm/yarn).

```shell
# Install dependencies
bun install

# Desktop dev (starts Angular dev server + Tauri shell)
bun run tauri dev

# Android/iOS (one-time init required first)
bun run tauri android init
bun run tauri ios init
bun run tauri android dev
bun run tauri ios dev

# Angular-only dev server (without Tauri, for UI work)
bun run start

# Build Angular frontend only
bun run build

# Build Tauri app for distribution
bun run tauri build
```

## Architecture

### Frontend (`src/`)
- Angular 20 standalone components (no NgModules)
- `app.config.ts` — providers bootstrap (router, zone change detection)
- `app.routes.ts` — route definitions
- IPC calls to Rust use `invoke()` from `@tauri-apps/api/core`

### Backend (`src-tauri/`)
- Rust entry point: `src-tauri/src/lib.rs` (exported as `oneclick_lib`)
- Tauri commands are registered in `lib.rs` via `invoke_handler!()`
- `tauri.conf.json` — app config: `beforeDevCommand` runs `bun run start`, dev server on port 1420
- Current identifier: `dev.sivalabs.oneclick`

### IPC Pattern
Angular calls Rust via `invoke<ReturnType>("command_name", { args })`. New Rust commands must be annotated with `#[tauri::command]` and registered in `tauri::Builder::invoke_handler()` in `lib.rs`.

### Planned Data Layer
SQLite is planned but not yet integrated. When adding it, use `tauri-plugin-sql` or a direct Rust SQLite crate (e.g. `rusqlite`/`sqlx`).
