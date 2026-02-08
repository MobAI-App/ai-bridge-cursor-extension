import * as vscode from "vscode";
import { execFile } from "child_process";
import * as os from "os";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let cachedEditorId: string | null = null;

export async function detectEditorId(): Promise<string> {
  if (cachedEditorId) {
    return cachedEditorId;
  }
  const commands = await vscode.commands.getCommands(true);
  if (commands.includes("composer.focusComposer")) {
    cachedEditorId = "cursor";
  } else if (commands.includes("antigravity.sendTextToChat")) {
    cachedEditorId = "windsurf";
  } else {
    cachedEditorId = "vscode";
  }
  return cachedEditorId;
}

export function getEditorId(): string {
  return cachedEditorId || "vscode";
}

function pressEnterOsLevel(bundleId: string): Promise<void> {
  return new Promise((resolve) => {
    const platform = os.platform();

    if (platform === "darwin") {
      const script = `
        tell application id "${bundleId}" to activate
        delay 0.5
        tell application "System Events" to key code 36
      `;
      execFile("osascript", ["-e", script], () => resolve());
    } else if (platform === "win32") {
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
      `;
      execFile("powershell", ["-Command", script], () => resolve());
    } else {
      execFile("xdotool", ["key", "Return"], () => resolve());
    }
  });
}

function isWindsurfChatVisible(): boolean {
  try {
    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        const input = tab.input;
        if (input && typeof input === "object" && "viewType" in input) {
          const viewType = (input as { viewType: string }).viewType;
          if (viewType.includes("antigravity") || viewType.includes("agent")) {
            return true;
          }
        }
      }
    }
  } catch {
    // Fallback: assume not visible
  }
  return false;
}

export function isChatOpen(): boolean {
  return true;
}

async function injectWindsurf(text: string, paranoid: boolean): Promise<void> {
  if (!isWindsurfChatVisible()) {
    await vscode.commands.executeCommand("antigravity.openAgent");
  }
  await vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup");
  await vscode.commands.executeCommand("antigravity.toggleChatFocus");

  const savedClipboard = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(text);
  await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
  await vscode.env.clipboard.writeText(savedClipboard);

  if (!paranoid) {
    await sleep(100);
    await pressEnterOsLevel("com.google.antigravity");
  }
}

async function injectCursor(text: string, paranoid: boolean): Promise<void> {
  const savedClipboard = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(text);

  await vscode.commands.executeCommand("composer.focusComposer");
  await sleep(500);
  await vscode.commands.executeCommand("editor.action.clipboardPasteAction");

  await vscode.env.clipboard.writeText(savedClipboard);

  if (!paranoid) {
    await sleep(100);
    await pressEnterOsLevel("com.todesktop.230313mzl4w4u92");
  }
}

async function injectVscode(text: string, paranoid: boolean): Promise<void> {
  const savedClipboard = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(text);

  await vscode.commands.executeCommand("workbench.action.chat.open");
  await sleep(500);
  await vscode.commands.executeCommand("editor.action.clipboardPasteAction");

  await vscode.env.clipboard.writeText(savedClipboard);

  if (!paranoid) {
    await sleep(100);
    await vscode.commands.executeCommand("workbench.action.chat.submit");
  }
}

export async function injectText(text: string): Promise<void> {
  const paranoid = vscode.workspace.getConfiguration("aibridge").get<boolean>("paranoid") ?? false;
  const editorId = await detectEditorId();

  if (editorId === "windsurf") {
    await injectWindsurf(text, paranoid);
  } else if (editorId === "cursor") {
    await injectCursor(text, paranoid);
  } else {
    await injectVscode(text, paranoid);
  }
}
