# Code Ref Copy

A minimal VS Code extension that copies selected code together with the workspace-relative file path and line range.

## Usage

1. Open this folder in VS Code.
2. Press **F5** to launch an Extension Development Host.
3. Open a project file and select some code.
4. Press **Ctrl+Alt+C** (Windows/Linux) or **Cmd+Alt+C** (macOS), or use **Copy Code with File Path and Line Numbers** from the editor context menu.

Example clipboard output:

````text
@src/core/engine.ts:42-44

```typescript
function calculate() {
  return 42;
}
```
````

The file must be saved. With multiple workspace roots, VS Code may include the workspace folder name in the relative path.

## Requirements

VS Code 1.74 or later. No dependencies, build step, or network access required.
