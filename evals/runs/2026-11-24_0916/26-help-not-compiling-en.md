**Let's fix the file first**

The file doesn't compile yet, so the test can't run. Three fixes:

1. **Install the test libraries (line 1).** Libraries are pieces of code your project needs to work. Vitest runs the tests, and Testing Library reads your page. jsdom gives them a fake browser. *(best practice)*
   ```sh
   npm install -D vitest @testing-library/react jsdom
   ```

2. **Import the test words (lines 3–4).** `describe`, `it` and `expect` come from Vitest. Add this as the new first line:
   ```ts
   import { describe, it, expect } from 'vitest'
   ```

3. **Close the brackets (line 7).** Line 5 closes `it`, but `describe` is still open. Add this at the end of the file:
   ```ts
   })
   ```
