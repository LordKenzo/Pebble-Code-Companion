```json
{
  "examples": [
    {
      "title": "Giving change at a till",
      "setup": "Change owed: 87 cents, counted as whole cents (like your grams) so no 0.1 + 0.2 surprises. Coins available, largest first: 50, 20, 10, 5, 2, 1. Coins are unlimited.",
      "trace": "Start with remaining = 87. Coin 50: 87 ≥ 50, take one, remaining 37. 37 < 50, so move on. Coin 20: 37 ≥ 20, take one, remaining 17. Then 17 < 20. Coin 10: take one, remaining 7. Coin 5: take one, remaining 2. Coin 2: take one, remaining 0. Coin 1: 0 < 1, so take none. Result: 50, 20, 10, 5, 2, which is five coins. The outer pass visits each coin once, from largest to smallest. The inner repetition keeps taking the same coin while it still fits. Remaining only ever shrinks. Note: this works because the coin set is well-behaved. With coins 4, 3, 1 and a target of 6, greedy gives 4+1+1 (three coins) while 3+3 needs only two."
    },
    {
      "title": "Turning a duration into hours, minutes, seconds",
      "setup": "A timer reads 9,754 seconds. The units are 3,600 (hour), 60 (minute) and 1 (second), tried from largest to smallest. Each unit can be used any number of times.",
      "trace": "Remaining = 9,754. Hour (3,600): 9,754 ≥ 3,600, take one hour, remaining 6,154. That still fits, so take a second hour, remaining 2,554. Now 2,554 < 3,600, so stop: 2 hours. Minute (60): subtract 60 again and again: 2,494, 2,434, … After 42 subtractions remaining is 34, and 34 < 60: 42 minutes. Second (1): 34 subtractions bring remaining to 0: 34 seconds. Result: 2 h 42 m 34 s. It is the same shape as before: for each unit, largest first, keep subtracting while it fits, then go to the next unit. Repeated subtraction gives the same count as integer division would. If 0 is left at the end, the input could be fully broken down."
    }
  ]
}
```
