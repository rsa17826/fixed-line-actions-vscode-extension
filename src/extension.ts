import vscode from "vscode"

function activate(context: vscode.ExtensionContext) {
  const commands = [
    ["lineFix.deleteLines", "editor.action.deleteLines"],
    ["lineFix.copyLinesUp", "editor.action.copyLinesUpAction"],
    ["lineFix.copyLinesDown", "editor.action.copyLinesDownAction"],
    ["lineFix.moveLinesUp", "editor.action.moveLinesUpAction"],
    ["lineFix.moveLinesDown", "editor.action.moveLinesDownAction"],
    ["lineFix.indentLines", "editor.action.indentLines"],
    ["lineFix.outdentLines", "editor.action.outdentLines"],
    ["lineFix.commentLine", "editor.action.commentLine"],
  ]

  for (const [cmd, action] of commands) {
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd, () => {
        const editor = vscode.window.activeTextEditor
        if (!editor) return

        editor.selections = editor.selections.map(
          (sel: vscode.Selection) => {
            // If a selection ends exactly at col 0 of a line below the start,
            // that line is treated as un-selected by VS Code's line commands.
            // Extend the end to the last char of that line to include it.
            if (!sel.isEmpty && sel.end.character === 0) {
              const endLine = sel.end.line
              const endChar =
                editor.document.lineAt(endLine).text.length
              return new vscode.Selection(
                sel.start,
                new vscode.Position(endLine, endChar),
              )
            }
            return sel
          },
        )
        return vscode.commands.executeCommand(action)
      }),
    )
  }
}

function deactivate() {}

module.exports = { activate, deactivate }
