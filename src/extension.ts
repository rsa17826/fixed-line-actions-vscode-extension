import vscode, { Position, Selection } from "vscode"

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
        const doc = editor.document

        if (cmd === "lineFix.commentLine") {
          editor.selections = editor.selections.map((sel) => {
            if (!sel.isEmpty && sel.end.character === 0) {
              const endChar = doc.lineAt(sel.end.line).text.length
              if (endChar > 0) {
                return new vscode.Selection(
                  sel.start,
                  new vscode.Position(sel.end.line, endChar),
                )
              }
            }
            return sel
          })
          return vscode.commands.executeCommand(action)
        }
        var temp: Selection[]
        editor
          .edit((eb) => {
            // @ts-ignore
            temp = editor.selections.map((sel: Selection) => {
              const startLine = sel.start.line
              // Always include sel.end.line even when end.character === 0 —
              // that's the whole point of this extension.
              const endLine = sel.end.line
              const endLen = doc.lineAt(endLine).text.length

              switch (cmd) {
                case "lineFix.deleteLines": {
                  if (endLine + 1 < doc.lineCount) {
                    // Normal case: consume the trailing newline via (endLine+1, 0)
                    eb.delete(
                      new vscode.Range(startLine, 0, endLine + 1, 0),
                    )
                  } else if (startLine > 0) {
                    // Deleting to EOF: consume the preceding newline instead
                    eb.delete(
                      new vscode.Range(
                        startLine - 1,
                        doc.lineAt(startLine - 1).text.length,
                        endLine,
                        endLen,
                      ),
                    )
                  } else {
                    // Entire file selected
                    eb.delete(new vscode.Range(0, 0, endLine, endLen))
                  }
                  return new Selection(
                    sel.start.translate(0, 0),
                    sel.start.translate(0, 0),
                  )
                }

                case "lineFix.copyLinesUp": {
                  const text = doc.getText(
                    new vscode.Range(startLine, 0, endLine, endLen),
                  )
                  eb.insert(
                    new vscode.Position(startLine, 0),
                    text + "\n",
                  )
                  return sel
                  // var d = startLine - endLine + 1
                  // sel.isReversed ?
                  //   new Selection(
                  //     sel.end.translate(d, 0),
                  //     sel.start.translate(d, 0),
                  //   )
                  // : new Selection(
                  //     sel.start.translate(d, 0),
                  //     sel.end.translate(d, 0),
                  //   )
                }

                case "lineFix.copyLinesDown": {
                  const text = doc.getText(
                    new vscode.Range(startLine, 0, endLine, endLen),
                  )
                  if (endLine + 1 < doc.lineCount) {
                    eb.insert(
                      new vscode.Position(endLine + 1, 0),
                      text + "\n",
                    )
                  } else {
                    // No line below: append after end of last line
                    eb.insert(
                      new vscode.Position(endLine, endLen),
                      "\n" + text,
                    )
                  }
                  var d = Math.abs(startLine - endLine) + 1
                  return sel.isReversed ?
                      new Selection(
                        sel.end.translate(d, 0),
                        sel.start.translate(d, 0),
                      )
                    : new Selection(
                        sel.start.translate(d, 0),
                        sel.end.translate(d, 0),
                      )
                }

                case "lineFix.moveLinesUp": {
                  if (startLine === 0) break
                  const lineAbove = doc.lineAt(startLine - 1).text
                  const selected = doc.getText(
                    new vscode.Range(startLine, 0, endLine, endLen),
                  )
                  // Replace [lineAbove, ...selectedLines] with [...selectedLines, lineAbove]
                  eb.replace(
                    new vscode.Range(
                      startLine - 1,
                      0,
                      endLine,
                      endLen,
                    ),
                    selected + "\n" + lineAbove,
                  )
                  var d = startLine - endLine + 1
                  return sel.isReversed ?
                      new Selection(
                        sel.end.translate(d, 0),
                        sel.start.translate(d, 0),
                      )
                    : new Selection(
                        sel.start.translate(d, 0),
                        sel.end.translate(d, 0),
                      )
                }

                case "lineFix.moveLinesDown": {
                  if (endLine >= doc.lineCount - 1) break
                  const lineBelow = doc.lineAt(endLine + 1).text
                  const selected = doc.getText(
                    new vscode.Range(startLine, 0, endLine, endLen),
                  )
                  // Replace [...selectedLines, lineBelow] with [lineBelow, ...selectedLines]
                  eb.replace(
                    new vscode.Range(
                      startLine,
                      0,
                      endLine + 1,
                      doc.lineAt(endLine + 1).text.length,
                    ),
                    lineBelow + "\n" + selected,
                  )
                  var d = -(startLine - endLine + 1)
                  return sel.isReversed ?
                      new Selection(
                        sel.end.translate(d, 0),
                        sel.start.translate(d, 0),
                      )
                    : new Selection(
                        sel.start.translate(d, 0),
                        sel.end.translate(d, 0),
                      )
                }

                case "lineFix.indentLines": {
                  const tabSize = editor.options.tabSize as number
                  const indent =
                    (editor.options.insertSpaces as boolean) ?
                      " ".repeat(tabSize)
                    : "\t"
                  for (
                    let line = startLine;
                    line <= endLine;
                    line++
                  ) {
                    eb.insert(new vscode.Position(line, 0), indent)
                  }
                  return sel
                }

                case "lineFix.outdentLines": {
                  const tabSize = editor.options.tabSize as number
                  for (
                    let line = startLine;
                    line <= endLine;
                    line++
                  ) {
                    const text = doc.lineAt(line).text
                    if (text.startsWith("\t")) {
                      eb.delete(new vscode.Range(line, 0, line, 1))
                    } else {
                      let spaces = 0
                      while (
                        spaces < text.length &&
                        spaces < tabSize &&
                        text[spaces] === " "
                      )
                        spaces++
                      const remove = Math.min(spaces, tabSize)
                      if (remove > 0)
                        eb.delete(
                          new vscode.Range(line, 0, line, remove),
                        )
                    }
                  }
                  return sel
                }
              }
            })
          })
          .then((e) => (editor.selections = temp))
      }),
    )
  }
}

function deactivate() {}

module.exports = { activate, deactivate }
