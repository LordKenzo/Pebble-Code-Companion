```json
{
  "examples": [
    {
      "title": "Giving change with coins (cents)",
      "setup": "A cashier owes 190 cents. Coins, largest first: 50, 20, 10, 5, 2, 1. Start with remaining = 190 and an empty list of coins handed out.",
      "trace": "Coin 50: 190 ≥ 50, give one, remaining 140. 140 ≥ 50, give one, remaining 90. 90 ≥ 50, give one, remaining 40. 40 < 50, move on. Coin 20: 40 ≥ 20, give one, remaining 20. 20 ≥ 20, give one, remaining 0. 0 < 20, move on. Coins 10, 5, 2 and 1 all fail the check at once because remaining is 0. Result: [50, 50, 50, 20, 20]. The outer pass walks the denominations once. The inner repeat keeps taking the same coin while it still fits. That is why the same value can appear several times in a row. If the 1-cent coin were missing and 3 cents were owed, the walk would end with remaining 1 and nobody would notice unless that leftover is checked."
    },
    {
      "title": "Splitting a duration into hours, minutes, seconds",
      "setup": "A timer reads 7385 seconds. Units, largest first: 3600 (hour), 60 (minute), 1 (second). Start with remaining = 7385 and count how many of each unit you take.",
      "trace": "Hour 3600: 7385 ≥ 3600, take one, remaining 3785. 3785 ≥ 3600, take one, remaining 185. 185 < 3600, move on: 2 hours. Minute 60: 185 → 125 → 65 → 5, taking three, then 5 < 60, move on: 3 minutes. Second 1: 5 → 4 → 3 → 2 → 1 → 0, taking five: 5 seconds. Result: 2 h 3 min 5 s. This works because each unit fits evenly into the one above it, so taking the biggest unit first is always correct. With unit sizes that don't fit evenly into each other, for example coins of 4, 3 and 1 for an amount of 6, the same walk gives 4+1+1 instead of 3+3. It is still a valid split, just not the one with the fewest pieces."
    }
  ]
}
```
