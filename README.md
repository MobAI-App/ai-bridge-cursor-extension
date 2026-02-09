# AiBridge Extension

A VS Code extension that exposes an HTTP API on `127.0.0.1:9999` allowing external applications to inject text into the editor's AI chat. Works with VS Code, Cursor, and other VS Code-based editors.

## Supported Editors

- **VS Code** — injects into Copilot Chat (`workbench.action.chat.open` + `workbench.action.chat.submit`)
- **Cursor** — injects into Composer (`composer.focusComposer` + OS-level Enter)
- **Windsurf** — injects via clipboard paste into agent panel (`antigravity.openAgent` + `antigravity.toggleChatFocus` + OS-level Enter)
- Other VS Code forks — falls back to VS Code behavior; detected at runtime via available commands

## Installation

1. Build the extension: `npm install && npm run compile`
2. Package: `npm run package`
3. Install the `.vsix` file in your editor (VS Code, Cursor, etc.)

## HTTP API

### GET /health

Health check endpoint.

```bash
curl http://127.0.0.1:9999/health
```

Response:
```json
{"status": "ok", "version": "1.1.0", "editor": "cursor"}
```

The `editor` field is detected at runtime (`"vscode"`, `"cursor"`, or `"windsurf"`).

### GET /status

Get server status.

```bash
curl http://127.0.0.1:9999/status
```

Response:
```json
{"child_tool": "cursor", "idle": true, "queueLength": 0, "chatOpen": true}
```

### POST /inject

Queue text for injection into the editor's AI chat.

```bash
curl -X POST http://127.0.0.1:9999/inject \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from external app"}'
```

Options:
- `?sync=true` - Wait for injection to complete before responding
- `priority` field - Higher priority items are processed first

Response:
```json
{"queued": true, "queueLength": 1}
```

### DELETE /queue

Clear pending injections.

```bash
curl -X DELETE http://127.0.0.1:9999/queue
```

## Permissions

Auto-submit requires different mechanisms depending on the editor:

- **VS Code**: Uses native `workbench.action.chat.submit` command — no extra permissions needed
- **Windsurf**: Uses clipboard paste for injection and OS-level Enter for submit:
  - **macOS**: System Settings → Privacy & Security → Accessibility → Enable for Windsurf
  - **Windows**: No additional permissions required
  - **Linux**: Requires `xdotool` installed (`sudo apt install xdotool`)
- **Cursor**: Uses OS-level keyboard simulation:
  - **macOS**: System Settings → Privacy & Security → Accessibility → Enable for Cursor
  - **Windows**: No additional permissions required
  - **Linux**: Requires `xdotool` installed (`sudo apt install xdotool`)

Set `aibridge.paranoid: true` to disable auto-submit and avoid permission prompts.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `aibridge.port` | 9999 | HTTP server port |
| `aibridge.host` | 127.0.0.1 | HTTP server host |
| `aibridge.paranoid` | false | Inject without auto-submit |
| `aibridge.autoStart` | true | Start server on activation |

## Commands

- **AiBridge: Start Server** - Start the HTTP server
- **AiBridge: Stop Server** - Stop the HTTP server
- **AiBridge: Show Status** - Show server status

## Used By

[MobAI](https://mobai.run) — a desktop app that gives AI coding agents the ability to see and control mobile devices. MobAI uses the AiBridge Extension to inject mobile app context (screenshots, UI trees, device state) directly into VS Code, Cursor, and Windsurf AI chats.

## License

MIT
