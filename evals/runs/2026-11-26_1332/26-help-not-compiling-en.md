**Let's fix the file first**

The editor shows errors, so the test can't run yet. Fix these three things in order:

1. **Install the missing libraries.** A library is a piece of code someone else wrote that your project uses. `@testing-library/react` isn't installed yet. Run this in the terminal, in the project folder:
```sh
npm install -D vitest jsdom @testing-library/react @testing-library/dom
```
`-D` saves them as development dependencies: tools you need while building, but not inside the finished app. (best practice: Vite projects usually use Vitest for tests.)

2. **Import the test functions.** `describe`, `it` and `expect` come from Vitest. TypeScript doesn't know them until you import them. Put this at the top of line 1:
```ts
import { describe, it, expect } from 'vitest'
```

3. **Close the last bracket.** Line 5 closes `it(...)`, but `describe(...)` from line 3 is still open. That's why the editor complains at line 7. Add this on line 6:
```ts
})
```

Once the red errors are gone, run `npx vitest` and tell me what it says.
