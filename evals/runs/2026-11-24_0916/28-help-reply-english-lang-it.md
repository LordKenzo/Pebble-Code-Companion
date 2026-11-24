**Answer · right**

Exactly: when `remaining` equals the plate, the condition on line 20 is false. So the 20 kg plate never goes on, and the loop falls through to the smaller ones. That's why you get `[15, 2.5, 1.25]`.

Fix the condition yourself, then rerun all four tests in the task ("20 kg", "22,5 kg", "60 kg", "142,5 kg"). The exact-match case comes up at every plate size, not just this one.
