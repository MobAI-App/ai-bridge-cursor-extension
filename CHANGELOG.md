# Changelog

## 1.1.0

- Renamed to `aibridge-extension`
- Added VS Code support (Copilot Chat)
- Added Windsurf support (Antigravity agent panel)
- Runtime editor detection via available commands
- Per-editor injection strategies (Cursor, VS Code, Windsurf)

## 1.0.1

- Added `child_tool` field to status response

## 1.0.0

- Initial release with Cursor support
- HTTP API: `/health`, `/status`, `/inject`, `/queue`
- Clipboard-based text injection into Cursor Composer
- OS-level auto-submit via keyboard simulation
- Priority queue for injection requests
- Configurable port, host, paranoid mode, auto-start
