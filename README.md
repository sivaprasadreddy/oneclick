# OneClick
OneClick is personal data management application to keep track of:
- Contacts
- Expenses
- Notes
- Reminders

## Tech Stack
- Tauri
- Rust
- Angular
- SQLite

## Local Development

```shell
cd oneclick
bun install
bun run tauri android init
bun run tauri ios init

For Desktop development, run:
bun run tauri dev

For Android development, run:
bun run tauri android dev

For iOS development, run:
bun run tauri ios dev
```