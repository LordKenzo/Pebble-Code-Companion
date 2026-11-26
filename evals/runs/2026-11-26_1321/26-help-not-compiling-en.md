**Let's fix the file first**

The editor shows errors, so the test can't run yet. Three fixes, in this order:

1. **Install the missing libraries** (line 1). A *dependency* is a piece of code yours needs in order to work. `@testing-library/react` isn't installed yet, so TypeScript can't find it. Run this in the terminal:
   ```sh
   npm install -D vitest @testing-library/react @testing-library/dom jsdom
   ```
   `-D` saves them as development dependencies, needed only for testing. `jsdom` gives the tests a fake browser page to draw on. *(best practice: Vite projects use Vitest.)*

2. **Import the test words** (lines 3–4). `describe`, `it` and `expect` come from Vitest, but the file never asks for them. Add this line at the top:
   ```ts
   import { describe, it, expect } from 'vitest'
   ```
   *(best practice)*

3. **Close the last bracket** (line 7). `describe(` opens a `{` on line 3, but line 5 only closes the `it` block. Add one more line at the end of the file:
   ```ts
   })
   ```
   *(best practice)*

Once the error list is empty, run `npx vitest` and we'll look at what the test says.
