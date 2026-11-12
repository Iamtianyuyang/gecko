const vscode = require('vscode');

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('codeRef.copy', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) return;

      const { document, selection } = editor;
      if (document.isUntitled || document.isDirty) {
        vscode.window.showWarningMessage('Save the file before copying a code reference.');
        return;
      }

      const path = vscode.workspace.asRelativePath(document.uri);
      const start = selection.start.line + 1;
      // An exclusive selection end at column 0 belongs to the previous line.
      const lastOffset = document.offsetAt(selection.end) - 1;
      const end = document.positionAt(lastOffset).line + 1;
      // A selection ending at column 0 carries a trailing newline the template adds itself.
      const code = document.getText(selection).replace(/\r?\n$/, '');
      // Use a safe fence even if the selected code contains backticks.
      let maxTicks = 3;
      for (const match of code.matchAll(/`+/g)) maxTicks = Math.max(maxTicks, match[0].length + 1);
      const fence = '`'.repeat(maxTicks);
      const text = `@${path}:${start}-${end}\n\n${fence}${document.languageId}\n${code}\n${fence}`;

      try {
        await vscode.env.clipboard.writeText(text);
      } catch (error) {
        vscode.window.showErrorMessage(`Copy failed: ${error.message}`);
      }
    })
  );
}

module.exports = { activate };
