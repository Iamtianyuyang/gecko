# Gecko

<img src="assets/logo/gecko.png" alt="Gecko" width="180">

A small VS Code extension that copies the selected code to the clipboard, prefixed with its workspace-relative path and line range.

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

Save the file first. If it has unsaved changes, you get a warning instead of a copy. In a multi-root workspace, the relative path may begin with the workspace folder name. A file outside every workspace folder is copied with its absolute path.

## Requirements

VS Code 1.74 or later. No dependencies, no build step, no network requests.

## License

MIT. See [LICENSE](LICENSE).
