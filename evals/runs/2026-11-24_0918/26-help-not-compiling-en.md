**Let's fix the file first**

1. **Install the missing libraries.** A *dependency* is a piece of code yours needs in order to work. Vitest runs the tests, Testing Library looks at the page, and jsdom pretends to be a browser. (best practice)
```sh
npm install -D vitest @testing-library/react @testing-library/dom jsdom
```

2. **Import the test words.** `describe`, `it` and `expect` come from Vitest. Add this at the top of the file:
```ts
import { describe, it, expect } from 'vitest'
```

3. **Close the brackets.** Line 3 opens two blocks, and line 5 closes only one. Add a new line after line 5:
```ts
})
```
