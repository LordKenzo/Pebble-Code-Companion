```json
{
  "examples": [
    {
      "title": "Giving change with coins",
      "setup": "A cashier owes 85 cents and has coins of 50, 20, 10, 5, 2 and 1 cent, ordered from largest to smallest. Amounts are in whole cents, so there is no rounding noise.",
      "trace": "Start with 85 remaining. Coin 50: 85 ≥ 50, give one, 35 left. 35 < 50, move on. Coin 20: 35 ≥ 20, give one, 15 left. 15 < 20, move on. Coin 10: 15 ≥ 10, give one, 5 left. Coin 5: 5 ≥ 5, give one, 0 left. Coins 2 and 1: 0 is smaller than both, so nothing is given. Result: 50 + 20 + 10 + 5. Variation: remove the 1-cent coin and owe 83. You get 50 (33 left), 20 (13), 10 (3), 2 (1). The final 1 cent fits no coin, so the loop ends with 1 still remaining and nobody notices unless someone checks what is left at the end."
    },
    {
      "title": "Turning seconds into hours, minutes and seconds",
      "setup": "A timer shows 7,384 seconds. The units are 3,600 (one hour), 60 (one minute) and 1 (one second), ordered from largest to smallest.",
      "trace": "Start with 7,384 remaining. Unit 3,600: 7,384 ≥ 3,600, take one hour, 3,784 left. 3,784 ≥ 3,600, take another, 184 left. 184 < 3,600, move on. Unit 60: take one minute, 124 left. Take another, 64 left. Take a third, 4 left. 4 < 60, move on. Unit 1: take one second four times, 4 → 3 → 2 → 1 → 0. Result: 2 hours, 3 minutes, 4 seconds. Each unit is handled completely, as many times as it fits, before the next smaller unit is considered. That is why the list must be sorted from largest to smallest."
    }
  ]
}
```
