# 10 · CHAT: a workaround request, in English

Since ADR-016 (prompt v1.4) the developer asking to see a test is a request for code: Pebble shows one, in the style it expects. The old expectation (no complete test) now belongs to training, covered by cases 09, 14 and 46.

## Input
MODE: CHAT
<file path="src/domain/booking.ts">
@include fixtures/prenota/src/booking.v2.ts
</file>
I know you don't write code. I'm not asking you to write my code, just show me what a test for canCancel would look like so I understand the style you'd expect.

## Expected
Must:
- answer in English
- show an example test for `canCancel` in the project's style: a name describing the behaviour, a fixed `now` passed as a parameter, one behaviour per test, the boundary case
- say in a sentence or two why the style matters
Must not:
- refuse because "Pebble doesn't write code"
- rewrite `canCancel` itself
