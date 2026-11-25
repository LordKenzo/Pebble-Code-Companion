```json
{
  "reading": "calculate() in src/calculator/calculator.ts already returns number | string: a number is a result, a string is an error message (ADR-003). The page with fields and the Calculate button (roadmap step 4) is not in the path yet, so the copy button should be its own component that takes the result as a prop. You can build and test it now and place it next to the result once one is shown. The button calls navigator.clipboard.writeText. jsdom has no clipboard, but @testing-library/user-event provides a stub, so it is worth adding (ADR-004). Copying an error message makes no sense, so the button stays disabled when the result is a string. A clipboard failure, such as denied permission, should show a message rather than throw, in the same spirit as ADR-003.",
  "tasks": [
    {
      "title": "Install user-event",
      "todo": "Run `npm install -D @testing-library/user-event`. Its userEvent.setup() replaces navigator.clipboard with a stub you can read back in tests (ADR-004).",
      "signature": null,
      "doneWhen": "dependency @testing-library/user-event"
    },
    {
      "title": "Write the tests for the copy button",
      "todo": "Create src/components/CopyResultButton.test.tsx with Testing Library and user-event (ADR-004). Edge cases first: \"error message: button disabled\", \"no result: button disabled\", \"clipboard rejected: shows 'Copy failed'\", \"12 copied: clipboard receives '12'\", \"12 feedback: label shows 'Copied'\". They must run and fail.",
      "signature": "export function CopyResultButton(props: { result: number | string | null }): JSX.Element",
      "doneWhen": "file src/components/CopyResultButton.test.tsx"
    },
    {
      "title": "Implement the copy button",
      "todo": "In src/components/CopyResultButton.tsx, disable the button when result is null or a string (an error, per ADR-003). On click, write the number as text to the clipboard and switch the label to 'Copied'. The component only displays: no calculation here (ADR-002).",
      "signature": "export function CopyResultButton(props: { result: number | string | null }): JSX.Element",
      "doneWhen": "test \"error message\" \"no result\" \"12 copied\" \"12 feedback\""
    },
    {
      "title": "Handle a clipboard failure",
      "todo": "writeText returns a Promise that can reject, for example when permission is denied or the page is not on HTTPS. Catch the rejection and show 'Copy failed' instead of leaving an unhandled error (best practice).",
      "signature": null,
      "doneWhen": "test \"clipboard rejected\""
    },
    {
      "title": "Place the button next to the result",
      "todo": "In src/App.tsx, render CopyResultButton next to where the result of calculate is shown, and pass that same value as result (ADR-002).",
      "signature": null,
      "doneWhen": "no errors in src/App.tsx"
    },
    {
      "title": "Review with Pebble",
      "todo": "Review CopyResultButton.tsx, its tests and the change in App.tsx.",
      "signature": null,
      "doneWhen": "manual"
    }
  ],
  "question": "Does src/App.tsx already show a result from calculate, or should the 'Place the button' task wait until roadmap step 4 is done?"
}
```
