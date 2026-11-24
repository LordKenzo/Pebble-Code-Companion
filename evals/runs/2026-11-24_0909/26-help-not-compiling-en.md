**Let's fix the file first**

The editor shows errors, so the tests can't run yet. Fix these three things in order:

1. **Missing libraries.** A library is ready-made code your project uses. The editor can't find Testing Library, so install it with the test tools. In a Vite project these are usually Vitest and jsdom, a fake browser for tests:
```sh
npm install -D vitest jsdom @testing-library/react @testing-library/dom
```

2. **Missing import.** `describe`, `it` and `expect` come from Vitest, so bring them in by adding this as line 2:
```ts
import { describe, it, expect } from 'vitest'
```

3. **Unclosed bracket.** Line 5 closes `it`, but nothing closes `describe`. Add this on a new line after line 5:
```ts
})
```
