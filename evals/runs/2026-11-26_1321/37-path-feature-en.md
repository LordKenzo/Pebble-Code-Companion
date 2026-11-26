```json
{
  "reading": "calculate in src/calculator/calculator.ts already returns number | string, with errors as values (ADR-003), so the copy feature only needs the UI side. Clipboard access is a browser side effect, so it stays out of src/calculator/ and lives in a small component (ADR-002). The path does not mark roadmap step 4 (fields, operation choice, button) as done, and I can't see whether src/App.tsx already shows a result. The plan therefore builds a standalone component that receives the result as a prop, and wires it in at the end. Two things to know: jsdom has no navigator.clipboard, so the tests must stub it with Vitest (ADR-004); in the browser the Clipboard API works only in a secure context (localhost or HTTPS, best practice).",
  "tasks": [
    {
      "title": "Write the tests for the copy button",
      "todo": "Create src/components/CopyResultButton.test.tsx with Testing Library and Vitest, stubbing navigator.clipboard.writeText with a vi.fn (ADR-004). Cover \"no result: button is disabled\", \"error message: button is disabled\", \"result 4: click copies 4\", \"result 2.5: click copies 2.5\", \"clipboard fails: shows Copy failed\", \"after copy: shows Copied\".",
      "signature": "",
      "doneWhen": "file src/components/CopyResultButton.test.tsx"
    },
    {
      "title": "Build the CopyResultButton component",
      "todo": "Create the component: the button is disabled when there is no number to copy. On click it writes the number as text to the clipboard and shows a short status. A failed write becomes a visible message, not a thrown error (ADR-003).",
      "signature": "export function CopyResultButton(props: { result: number | string | null }): JSX.Element",
      "doneWhen": "test \"no result\" \"error message\" \"result 4\" \"result 2.5\" \"clipboard fails\" \"after copy\""
    },
    {
      "title": "Show the button next to the result",
      "todo": "In src/App.tsx, render CopyResultButton next to where the calculate result is shown, and pass it that same value. Don't call the clipboard from App directly (ADR-002).",
      "signature": "",
      "doneWhen": "no errors in src/App.tsx"
    },
    {
      "title": "Review with Pebble",
      "todo": "Review the component, the clipboard stub in the tests and the wiring in App.tsx. Check the copy by hand in the browser at localhost.",
      "signature": "",
      "doneWhen": "manual"
    }
  ],
  "question": "Does src/App.tsx already show a result from calculate, or is roadmap step 4 (fields and button) still to be built before this feature?"
}
```
