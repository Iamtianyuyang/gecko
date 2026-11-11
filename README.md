# Gecko

A small VS Code extension. Select code, press one key, and the clipboard gets the selection with its workspace-relative file path and line range.

## Usage

1. Open this folder in VS Code.
2. Press **F5** to start an Extension Development Host.
3. Open a project file and select some code.
4. Press **Ctrl+Alt+C** (Windows/Linux) or **Cmd+Alt+C** (macOS), or pick **Copy Code with File Path and Line Numbers** from the editor context menu.

Copied output looks like this:

````text
@src/core/engine.ts:42-44

```typescript
function calculate() {
  return 42;
}
```
````

Save the file first; an unsaved buffer gets a warning instead of a copy. In a workspace with several roots, the relative path may begin with the workspace folder name.

## Requirements

VS Code 1.74 or later. The extension has no dependencies, no build step, and makes no network requests.

## License

MIT. See [LICENSE](LICENSE).
