{
  "examples": [
    {
      "title": "Making change with euro coins, largest coin first",
      "setup": "Amount to pay: 6.37 euro, which is 637 cents. Coin values in cents, largest first: 200, 100, 50, 20, 10, 5, 2, 1. Take coins of the largest value that still fits the remaining amount, as many times as they fit, then move to the next value.",
      "trace": "Start with 637 remaining. The 200 coin fits 3 times (3 × 200 = 600), leaving 37. The 100 and 50 coins do not fit into 37. The 20 coin fits once, leaving 17. The 10 coin fits once, leaving 7. The 5 coin fits once, leaving 2. The 2 coin fits once, leaving 0. Nothing is left, so the process stops. Result: three 2-euro coins, one 20-cent, one 10-cent, one 5-cent and one 2-cent coin. Check: 600 + 20 + 10 + 5 + 2 = 637."
    },
    {
      "title": "Filling 95 minutes with fixed-length blocks, longest block first",
      "setup": "A 95-minute window must be filled with blocks of 60, 30, 15 and 5 minutes. Take the longest block that still fits in the remaining time, as many times as it fits, then move to the next length. The goal is to fill the window with as few blocks as possible without going over.",
      "trace": "Start with 95 minutes remaining. A 60-minute block fits once, leaving 35. A 30-minute block fits once, leaving 5. The 15-minute block does not fit into 5. A 5-minute block fits once, leaving 0. The window is full, so the process stops. Result: 60 + 30 + 5 = 95 minutes, using three blocks. The 15-minute block is skipped only because the remaining time was already smaller than it."
    }
  ]
}
