```json
{
  "reading": "calculate in src/calculator/calculator.ts returns number | string, with errors as strings (ADR-003). The path shows step 4 (fields, operation choice, button) not yet done, and I can't see App.tsx's content, so this plan assumes the page will hold the current result in state. The clipboard is a browser concern, so the copy logic stays in a component and out of src/calculator/ (ADR-002). jsdom has no navigator.clipboard, so the tests stub writeText with vi.fn (ADR-004).",
  "tasks": [
    {
      "title": "Write the tests for the copy button",
      "todo": "Create src/components/CopyButton.test.tsx with Testing Library and a vi.fn stub on navigator.clipboard.writeText (ADR-004). Cover: \"result 12: clicking Copy writes 12 to the clipboard\", \"result 12: shows Copied after a successful copy\", \"no result: Copy is disabled\", \"clipboard rejects: shows Copy failed without throwing\" (ADR-003). Run them and confirm they fail.",
      "signature": "",
      "doneWhen": "file src/components/CopyButton.test.tsx"
    },
    {
      "title": "Implement CopyButton",
      "todo": "Create the component. It receives the value to copy, is disabled when the value is null, calls navigator.clipboard.writeText, and shows a short confirmation. Keep it free of calculator logic (ADR-002).",
      "signature": "export function CopyButton({ value }: { value: string | null }): JSX.Element",
      "doneWhen": "test \"result 12\" \"no result\""
    },
    {
      "title": "Handle a clipboard failure",
      "todo": "When writeText rejects (no permission, insecure context), catch the error and show 'Copy failed' as a value instead of letting it escape (ADR-003).",
      "signature": "",
      "doneWhen": "test \"clipboard rejects\""
    },
    {
      "title": "Wire CopyButton into the page",
      "todo": "In src/App.tsx, render CopyButton next to the result. Pass the numeric result as a string, and pass null when there is no result yet or when calculate returned an error message.",
      "signature": "",
      "doneWhen": "no errors in src/App.tsx"
    },
    {
      "title": "Review with Pebble",
      "todo": "Review CopyButton, its tests and the wiring in App.tsx.",
      "signature": "",
      "doneWhen": "manual"
    }
  ],
  "question": "Does src/App.tsx already show a calculation result, or should this feature wait until step 4 builds the fields and the button?"
}
```
