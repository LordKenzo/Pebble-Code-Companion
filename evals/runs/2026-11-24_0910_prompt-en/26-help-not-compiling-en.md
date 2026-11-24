**Let's fix the file first**

The file has errors, so the test can't run yet. Fix these three things:

1. **Install the testing tools.** A *dependency* is a piece of code your project needs to work. This one is missing (`best practice`):
```sh
npm install -D vitest jsdom @testing-library/react @testing-library/dom
```

2. **Import the test words.** `describe`, `it` and `expect` come from Vitest. Change line 1 to:
```ts
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
```

3. **Close the brackets.** Line 3 opens `describe(` with `{`, but only `it` gets closed on line 5. Add this as the last line:
```ts
})
```
