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

        editor.edit((editBuilder) => {
          for (const sel of editor.selections) {
            const endLine = sel.end.line
            const endChar =
              editor.document.lineAt(endLine).text.length
            // Delete up to the end of that empty/hidden line
            switch (cmd) {
              case "lineFix.deleteLines":
                editBuilder.delete(
                  new vscode.Range(sel.start.line, 0, endLine + 1, 0),
                )
                break
              // case "lineFix.copyLinesUp":
              //   passx
              default:
                console.error("no action for ", cmd)
            }
          }
        })
        // return vscode.commands.executeCommand(action)
      }),
    )
  }
}

function deactivate() {}

module.exports = { activate, deactivate }
