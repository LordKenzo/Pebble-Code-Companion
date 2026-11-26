**Answer · right**

Exactly. With `remaining` equal to `plate`, the condition on line 20 is false, so the 20 kg plate never goes on. The loop moves to smaller plates and fills the 20 with 15 + 2.5 + 1.25 + … Fix the condition yourself so a plate is used when it fits exactly, then run the tests again. The "22,5 kg" and "142,5 kg" cases will show whether your fix works for the small plates too.
