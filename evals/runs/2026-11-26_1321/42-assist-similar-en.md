```json
{
  "examples": [
    {
      "title": "Giving change with euro coins",
      "setup": "A cashier owes 87 cents. The coin drawer holds 50, 20, 10, 5, 2 and 1 cent coins, sorted from largest to smallest, and there are as many of each as needed. The rule: start with the biggest coin and keep handing it out while it still fits in what is owed, then move to the next smaller coin.",
      "trace": "Owed 87. Coin 50: 87 is at least 50, so hand one out and 37 is left. Is 37 at least 50? No, so move on. Coin 20: 37 is at least 20, hand one out and 17 is left. 17 is less than 20, move on. Coin 10: hand one out, 7 left. 7 is less than 10, move on. Coin 5: hand one out, 2 left. 2 is less than 5, move on. Coin 2: hand one out, 0 left. 0 is less than 2, move on. Coin 1: 0 is less than 1, so none is handed out. Change given: 50, 20, 10, 5, 2, which is five coins adding up to 87. The amounts are whole cents, so the remainder lands exactly on 0."
    },
    {
      "title": "Turning seconds into hours, minutes and seconds",
      "setup": "A timer shows 7,384 seconds and you want to read it as hours, minutes and seconds. The units, from largest to smallest, are 1 hour (3,600 s), 1 minute (60 s) and 1 second (1 s). For each unit, keep taking one off the remaining time while it still fits, and count how many times you took it.",
      "trace": "Remaining 7,384. Hour unit: 7,384 is at least 3,600, take one and 3,784 is left. 3,784 is still at least 3,600, take another and 184 is left. 184 is less than 3,600, so stop: 2 hours. Minute unit: 184 is at least 60, take one and 124 is left. Take another, 64 left. Take another, 4 left. 4 is less than 60, so stop: 3 minutes. Second unit: take one four times, 4 → 3 → 2 → 1 → 0, then stop: 4 seconds. Result: 2 h 3 min 4 s. Here the inner step takes the same unit several times in a row before the outer step moves to the next unit."
    }
  ]
}
```
