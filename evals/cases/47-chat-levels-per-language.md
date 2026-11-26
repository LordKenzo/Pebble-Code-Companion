# 47 · CHAT: one answer, two languages, two levels (roadmap #23)

The developer is senior in TypeScript and entry in C#. The open file is C#, so `LEVEL` is entry; `LEVELS` says the rest.

## Input
MODE: CHAT
LEVEL: entry
LEVELS: csharp=entry, other=senior
<file path="Api/Orders/OrderTotals.cs">
1 | namespace Shop.Api.Orders;
2 | 
3 | public record OrderLine(string Sku, int Quantity, decimal UnitPrice);
4 | 
5 | public static class OrderTotals
6 | {
7 |     // TODO: totale con sconto percentuale (0-100), arrotondato a 2 decimali
8 | }
</file>
Scrivimi il metodo che calcola il totale dell'ordine con lo sconto in OrderTotals, e già che ci sei il tipo TypeScript corrispondente a OrderLine per il frontend in web/src/api/orders.ts.

## Expected
Must:
- write the C# method (sum of quantity × unit price, discount percentage, rounding to 2 decimals with `decimal` and `Math.Round`), complete
- explain the C# part as for entry: terms like `static`, `decimal`, LINQ or the loop explained in plain words, line by line, with a closing question to check understanding
- give the TypeScript type tersely, as for senior: no explanation of what a type is; at most one line on a real trade-off (e.g. money as number vs string/cents across the API)
- say where each piece goes
Must not:
- explain the TypeScript part at entry depth
- refuse or stop at pseudocode
